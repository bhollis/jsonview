#!/usr/bin/env python
import os, sys, subprocess, tempfile, shutil
import getopt
import json, ConfigParser
import xml.etree.ElementTree as ET
import zipfile

NAME = "jsonview"
VERSION = json.load(open("package.json"))["version"]
XPI_NAME = "{}-{}.xpi".format(NAME, VERSION)

## Helpers ##


def getProfileDir(profileName):
  """
  Search for profile dir
  """
  if os.name == "nt":
    homeDir = os.path.join(os.getenv("APPDATA"), "Mozilla", "Firefox")
  else:
    homeDir = os.path.join(os.path.expanduser("~"), ".mozilla", "firefox")

  profilesPath = os.path.join(homeDir, "profiles.ini")
  config = ConfigParser.ConfigParser()
  config.read(profilesPath)

  for section in config.sections():
    if section.startswith("Profile") \
        and config.get(section, "Name") == profileName:
      return os.path.join(homeDir, config.get(section, "Path"))

  raise Exception("Profile '{}' does not exist.".format(profileName))


def copyLocalizedDescription(source, target):
  """
  Copy all localized description tags
  """
  rdfNamespace = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  emNamespace = "http://www.mozilla.org/2004/em-rdf#"

  targetTree = ET.parse(target)
  targetDesc = targetTree.getroot().find("./{{{}}}Description" \
      .format(rdfNamespace))

  sourceTree = ET.parse(source)
  sourceTagName = "./{{{}}}Description/{{{}}}localized" \
      .format(rdfNamespace, emNamespace)

  for a in sourceTree.getroot().findall(sourceTagName):
    targetDesc.append(a)

  ET.register_namespace("", rdfNamespace)
  ET.register_namespace("em", emNamespace)
  targetTree.write(target, "utf-8", True)


def unpackXpi(source, target):
  """
  Unpack a xpi to a folder
  """
  xpi = zipfile.ZipFile(source, "r")
  xpi.extractall(target)
  xpi.close()


def packXpi(source, target):
  """
  Recreate a xpi file from a folder
  """
  xpi = zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED)

  for dirPath, dirNames, fileNames in os.walk(source):
    for name in fileNames:
      filePath = os.path.join(dirPath, name)
      relPath = os.path.relpath(filePath, source)
      xpi.write(filePath, relPath)

  xpi.close()


def createXpi(xpiName):
  """
  Generate XPI file
  """
  args = ["cfx", "xpi", "--output-file=" + xpiName]
  return subprocess.call(args)


def runBrowser(profileDir):
  """
  Run in browser
  """
  args = ["cfx", "run"]
  if profileDir is not None:
    args.append("-p")
    args.append(profileDir)

  return subprocess.call(args)


def fixLocalizedDescription(inputXpi, outputXpi):
  """
  Mozilla bug 661083
  Addon metadata can not be localized. It requires unpacking the xpi,
  updating the install.rdf and compressing everything again.
  """
  targetDir = tempfile.mkdtemp()
  targetFile = "install.rdf"

  unpackXpi(inputXpi, targetDir)
  copyLocalizedDescription(os.path.join("src", targetFile), \
      os.path.join(targetDir, targetFile))
  packXpi(targetDir, outputXpi)

  # Cleanup
  shutil.rmtree(targetDir)


def printUsage():
  """
  Print usage
  """
  print("Usage: {} [OPTIONS...] COMMAND".format(sys.argv[0]))
  print("""
COMMANDS:
  run     Run the addon
  xpi     Create xpi file
  fix     Fix localized description in generated xpi

OPTIONS:
  -p PROFILE, --profile=PROFILE
          Used with command 'run'. Open the addon with the specific browser
          profile. PROFILE can be either an absolute path or a profile name
          (i.e. 'dev'), which then be translated to profile path in
          ~/.mozilla/firefox
""")

## Tasks ##
def help(opts):
  printUsage()

def run(opts):
  profileDir = None

  for o, a in opts:
    if o in ("-p", "--profile"):
      profileDir = a
    else:
      print("Unhandled option: {}".format(o))
      printUsage()
      return 1

  # If profile is just a name, search for full path
  if profileDir is not None \
      and "/" not in profileDir \
      and "\\" not in profileDir:
    profileName = profileDir
    profileDir = getProfileDir(profileName)

  return runBrowser(profileDir)

def xpi(opts):
  return createXpi(XPI_NAME)

def fix(opts):
  if not os.path.isfile(XPI_NAME):
    raise Exception("File '{}' must be created before running this task."
        .format(XPI_NAME))
  outputXpi = "fixed-{}".format(XPI_NAME)

  fixLocalizedDescription(XPI_NAME, outputXpi)
  print("File created: {}".format(outputXpi))
  return 0

if __name__ == "__main__":
  try:
    opts, args = getopt.getopt(sys.argv[1:], "p:", ["profile="])
  except getopt.GetoptError as err:
    print(str(err))
    printUsage()
    sys.exit(1)

  if not args:
    printUsage()
    sys.exit(1)

  for cmd in args:
    if cmd in locals():
      print("Running task: {}...".format(cmd))
      locals()[cmd](opts)
    else:
      print("Command '{}' is not supported".format(cmd))
      printUsage()
      sys.exit(1)
  sys.exit(0)

# vim: set ts=2 sts=2 sw=2 expandtab:
