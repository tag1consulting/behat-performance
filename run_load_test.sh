#!/bin/bash
source run_load_test.cfg
./start_sahi.sh&
PID=$!
$DRUSH -r $RESULTS_SITE_PATH -l $RESULTS_SITE_URI pts
$BEHAT $FEATURES
$DRUSH -r $RESULTS_SITE_PATH -l $RESULTS_SITE_URI pttd
pkill -P $PID
