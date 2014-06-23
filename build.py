#!/usr/bin/env python
import os, sys
import subprocess, threading
import tempfile, shutil
import argparse
import json, ConfigParser
import xml.etree.ElementTree as ET
import zipfile
import SimpleHTTPServer, SocketServer

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


def runBrowser(profileDir=None, browserArgs=None):
  """
  Run in browser
  """
  args = ["cfx", "run"]
  if profileDir is not None:
    args.append("-p")
    args.append(profileDir)
  if browserArgs is not None:
    args.append("--binary-args")
    args.append(browserArgs)

  return subprocess.call(args)


def runHTTPServer(port):
  """
  Start HTTP server at current directory
  """
  class TCPServer(SocketServer.TCPServer):
    allow_reuse_address = True

    def start(self):
      self.thread = threading.Thread(target=self.serve_forever)
      self.thread.start()

    def stop(self):
      self.shutdown()
      self.thread.join()

  server = TCPServer(("", port), SimpleHTTPServer.SimpleHTTPRequestHandler)
  server.start()
  return server


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


def parseArgs():
  """
  Create parser for command arguments
  """
  class ArgParser(argparse.ArgumentParser):
    def error(self, message):
      sys.stderr.write("error: {}\n".format(message))
      self.print_help()
      sys.exit(2)

  parser = ArgParser(formatter_class=argparse.RawTextHelpFormatter)
  parser.add_argument("-p", "--profile", default=None, help="""\
Used with command 'run'. Opens the addon with the specific browser
profile. PROFILE can be either an absolute path or a profile name
(i.e. 'dev'), which can then be translated to the profile path in
~/.mozilla/firefox.""")
  parser.add_argument("-b", "--bind", metavar="PORT", default=None, help="""\
Used with command 'run'. Also starts integrated HTTP server
listening on the given port number.""")
  parser.add_argument("-u", "--url", default=None, help="""\
Used with command 'run'. Also opens the given url from the browser.""")
  parser.add_argument("command", nargs="+", help="""\
run: Run the addon.
xpi: Create xpi file.
fix: Fix localized description in generated xpi.""")

  return parser.parse_args()

## Tasks ##

def run(args):
  """
  Runs the add-on.  Starts a browser session with given URL.
  """
  # If profile is just a name, search for full path
  if args.profile is not None \
      and "/" not in args.profile \
      and "\\" not in args.profile:
    args.profile = getProfileDir(args.profile)

  # Start HTTP server if listening port is specified
  if args.bind is not None:
    print("Starting HTTP server...")
    server = runHTTPServer(int(args.bind))
    if args.url is None:
      # Automatically open tests directory
      args.url = "localhost:{}/tests".format(args.bind)
  else:
    server = None

  # Prepend url parameter
  if args.url is not None:
    args.url = "-url {}".format(args.url)

  runBrowser(args.profile, args.url)

  # Browser closed, terminate the HTTP server
  if server is not None:
    print("Shutting down HTTP server...")
    server.stop()

def xpi(args):
  createXpi(XPI_NAME)

def fix(args):
  """
  Checks if XPI file is created, or else creates it
  """
  if not os.path.isfile(XPI_NAME):
    raise Exception("File '{}' must be created before running this task."
        .format(XPI_NAME))
  outputXpi = "fixed-{}".format(XPI_NAME)

  fixLocalizedDescription(XPI_NAME, outputXpi)
  print("File created: {}".format(outputXpi))


if __name__ == "__main__":
  args = parseArgs()

  for cmd in args.command:
    if cmd in locals():
      print("Running task: {}...".format(cmd))
      locals()[cmd](args)
    else:
      print("Command '{}' is not supported".format(cmd))
      sys.exit(1)
  sys.exit(0)

# vim: set ts=2 sts=2 sw=2 expandtab:
