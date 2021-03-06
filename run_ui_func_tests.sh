#!/bin/bash

#    Copyright 2016 Mirantis, Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

set -eu

function usage {
  echo "Usage: $0 [OPTION]..."
  echo "Run Fuel UI functional tests"
  echo ""
  echo "  -h, --help                  Print this usage message"
  echo "      --no-ui-build           Skip UI build"
  echo "      --no-nailgun-start      Skip Nailgun start"
  exit
}

no_ui_build=0
no_nailgun_start=0
tests=

function process_options {
  for arg in $@; do
    case "$arg" in
      -h|--help) usage;;
      --no-ui-build) no_ui_build=1;;
      --no-nailgun-start) no_nailgun_start=1;;
      -*);;
      *) tests="$tests $arg"
    esac
  done
}

FUEL_WEB_ROOT=$(readlink -f ${FUEL_WEB_ROOT:-$(dirname $0)/../fuel-web})
NAILGUN_ROOT=$FUEL_WEB_ROOT/nailgun

ARTIFACTS=${ARTIFACTS:-`pwd`/test_run/ui_func}
mkdir -p $ARTIFACTS

export NAILGUN_STATIC=$ARTIFACTS/static
export NAILGUN_TEMPLATES=$NAILGUN_STATIC

export NAILGUN_PORT=${NAILGUN_PORT:-5544}
export NAILGUN_START_MAX_WAIT_TIME=${NAILGUN_START_MAX_WAIT_TIME:-30}

export NAILGUN_DB_HOST=${NAILGUN_DB_HOST:-/var/run/postgresql}
export NAILGUN_DB=${NAILGUN_DB:-nailgun}
export NAILGUN_DB_USER=${NAILGUN_DB_USER:-nailgun}
export NAILGUN_DB_USERPW=${NAILGUN_DB_USERPW:-nailgun}

export DB_ROOT=${DB_ROOT:-postgres}

export NAILGUN_FIXTURE_FILES="${NAILGUN_ROOT}/nailgun/fixtures/sample_environment.json ${NAILGUN_ROOT}/nailgun/fixtures/sample_plugins.json"

export NAILGUN_CHECK_URL='/api/version'


# Run UI functional tests.
#
# Arguments:
#
#   $@ -- tests to be run; with no arguments all tests will be run
function run_ui_func_tests {
  local GULP="./node_modules/.bin/gulp"
  local TESTS_DIR=static/tests/functional # FIXME(vkramskikh): absolute path should be used
  local TESTS=$TESTS_DIR/test_*.js

  pushd "$FUEL_WEB_ROOT" > /dev/null
  tox -e cleanup
  popd > /dev/null

  if [ $# -ne 0 ]; then
    TESTS=$@
  fi

  if [ $no_ui_build -ne 1 ]; then
    echo "Building UI..."
    ${GULP} build --no-sourcemaps --extra-entries=sinon --static-dir=$NAILGUN_STATIC
  else
    echo "Using pre-built UI from $NAILGUN_STATIC"
    if [ ! -f "$NAILGUN_STATIC/index.html" ]; then
      echo "Cannot find pre-built UI. Don't use --no-ui-build key"
      return 1
    fi
  fi

  echo "Building tests..."
  ${GULP} intern:transpile

  if [ $no_nailgun_start -ne 1 ]; then
      pushd "$FUEL_WEB_ROOT" > /dev/null
      tox -e stop
      popd > /dev/null
  fi

  local result=0

  for testcase in $TESTS; do
    pushd "$FUEL_WEB_ROOT" > /dev/null
    tox -e cleanup
    popd > /dev/null

    if [ $no_nailgun_start -ne 1 ]; then
        pushd "$FUEL_WEB_ROOT" > /dev/null
        tox -e start
        popd > /dev/null
    fi

    SERVER_PORT=$NAILGUN_PORT \
    ARTIFACTS=$ARTIFACTS \
    ${GULP} functional-tests --no-transpile --suites=$testcase || result=1

    if [ $no_nailgun_start -ne 1 ]; then
        pushd "$FUEL_WEB_ROOT" > /dev/null
        tox -e stop
        popd > /dev/null
    fi

    if [ $result -ne 0 ]; then
      break
    fi
  done

  return $result
}


# parse command line arguments and run the tests
process_options $@
run_ui_func_tests $tests
