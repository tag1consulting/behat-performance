#!/bin/bash
source run_load_test.cfg

export SAHI_USERDATA_DIR=$SAHI_HOME/userdata
export SAHI_EXT_CLASS_PATH=
. $SAHI_HOME/bin/sahi.sh
