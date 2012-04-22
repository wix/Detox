import argparse
import json
import sys
import subprocess
import urlparse

from twisted.python import log
from twisted.internet import reactor
from twisted.web.server import Site
from twisted.web.static import File
from autobahntestsuite.fuzzing import FuzzingServerFactory
from autobahn.websocket import listenWS

class jsondict(dict):
    def __init__(self, json_value):
        if isinstance(json_value, dict):
            dict.__init__(self, json_value)
        else:
            dict.__init__(self, json.loads(json_value))

    def append(self, other):
        self.update(jsondict(other))

    def __repr__(self):
        return "'%s'" % json.dumps(self)

def parse_opts(s):
    return dict(s.split('='))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-u', '--url', default='ws://localhost:9001', help='Listen URL [default: %(default)s]')
    parser.add_argument('-O', '--options', default=jsondict({'failByDrop':False}), type=jsondict, action='append', help='extra options (overwrites existing) [default: %(default)s]')

    parser.add_argument('-p', '--webport', default=9090, type=int)
    parser.add_argument('-i', '--listen-interface', default='localhost', help='interface to listen on')
    parser.add_argument('-w', '--webdir', default='.')
    parser.add_argument('-d', '--debug', default=False, action='store_true', help='Debug Mode [default: %(default)s]')

    parser.add_argument('-o', '--outdir', default='./pages/results', metavar='DIR', help='Output Directory [default: %(default)s]')

    parser.add_argument('-c', '--cases', default=['*'], nargs='+', help='test cases [default: %(default)s]')
    parser.add_argument('-x', '--exclude-cases', default=[], nargs='+', help='test cases to exclude [default: %(default)s]')

    parser.add_argument('-l', '--logfile', type=argparse.FileType('w'), default=sys.stdout, help='logging file [default: stdout]')

    parser.add_argument('-t', '--exit-timeout', metavar='SECONDS', default=None, type=float, help='Will automatically exit after %(metavar)s seconds [default: %(default)s]')

    args = parser.parse_args()

    spec = args.__dict__

    log.startLogging(args.logfile)
 
    ## fuzzing server
    fuzzer = FuzzingServerFactory(spec)
    listenWS(fuzzer, interface=args.listen_interface)
 
    ## web server
    webdir = File(args.webdir)
    web = Site(webdir)
    reactor.listenTCP(args.webport, web, interface=args.listen_interface)
 
    log.msg("Using Twisted reactor class %s" % str(reactor.__class__))

    if args.exit_timeout:
        def exit_callback():
            log.msg("Exiting due to timeout (--exit-timeout/-t)")
            reactor.fireSystemEvent('shutdown')
            #reactor.stop()
            sys.exit(12)

        reactor.callLater(args.exit_timeout, exit_callback)
    
    reactor.run()
