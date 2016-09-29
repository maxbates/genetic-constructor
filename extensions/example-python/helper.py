#!/usr/bin/python

import sys

# print 'Argument List:', str(sys.argv)

print "(added by python)"

with open(str(sys.argv[1]), 'r') as f:
    print f.read()