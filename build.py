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

# Search for profile dir
def getProfileDir(profileName):
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
  return None

# Copy all localized description tags
def copyLocalizedDescription(source, target):
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

# Unpack a xpi to a folder
def unpackXpi(source, target):
  xpi = zipfile.ZipFile(source, "r")
  xpi.extractall(target)
  xpi.close()

# Recreate a xpi file from a folder
def packXpi(source, target):
  xpi = zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED)

  for dirPath, dirNames, fileNames in os.walk(source):
    for name in fileNames:
      filePath = os.path.join(dirPath, name)
      relPath = os.path.relpath(filePath, source)
      xpi.write(filePath, relPath)

  xpi.close()

# Generate XPI file
def createXpi(xpiName):
  args = ["cfx", "xpi", "--output-file=" + xpiName]
  return subprocess.call(args)

# Run in browser
def runBrowser(profileDir):
  args = ["cfx", "run"]
  if profileDir is not None:
    args.append("-p")
    args.append(profileDir)

  return subprocess.call(args)

# Mozilla bug 661083
# Addon metadata can not be localized. It requires unpacking the xpi,
# updating the install.rdf and compressing everything again.
def fixLocalizedDescription(xpiName):
  if not os.path.isfile(xpiName):
    print("File {} must be created before running this task")
    return 1

  targetDir = tempfile.mkdtemp()
  targetFile = "install.rdf"

  unpackXpi(XPI_NAME, targetDir)
  copyLocalizedDescription(os.path.join("src", targetFile), \
      os.path.join(targetDir, targetFile))
  packXpi(targetDir, "fixed-" + xpiName)

  # Cleanup
  shutil.rmtree(targetDir)
  return 0

# Print usage
def printUsage():
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
    if profileDir is None:
      print("Profile '{}' does not exist.".format(profileName))
      return 1

  return runBrowser(profileDir)

def xpi(opts):
  return createXpi(XPI_NAME)

def fix(opts):
  targetDir = tempfile.mkdtemp()
  targetFile = "install.rdf"

  unpackXpi(XPI_NAME, targetDir)
  copyLocalizedDescription(os.path.join("src", targetFile), \
      os.path.join(targetDir, targetFile))
  packXpi(targetDir, "fixed-" + XPI_NAME)

  # Cleanup
  shutil.rmtree(targetDir)
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
