#!/bin/bash

DIR=$(cd $(dirname "${BASH_SOURCE[0]}"); pwd)
source $DIR/run_load_test.cfg
$PHANTOMJS --webdriver=4444 $PHANTOMNETWORKJS &
PID=$!
$DRUSH -r $RESULTS_SITE_PATH -l $RESULTS_SITE_URI pts

# Behat fails to find the bootstrap directory unless run from the behat
# install so change directory here.
cd $BEHAT_TESTS
$BEHAT_TESTS/bin/behat $BEHAT_TESTS/features

$DRUSH -r $RESULTS_SITE_PATH -l $RESULTS_SITE_URI migrate-import --all
$DRUSH -r $RESULTS_SITE_PATH -l $RESULTS_SITE_URI ptdenorm
$DRUSH -r $RESULTS_SITE_PATH -l $RESULTS_SITE_URI pttd

pkill -P $PID
