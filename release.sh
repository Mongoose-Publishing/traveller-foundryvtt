#!/bin/bash

version=$(cat mgt2/system.json | jq -r .version)
patch=$(echo $version | sed 's/.*\.//')
minor=$(echo $version | sed 's/\.[0-9]*$//')

if [ -z $1 ]
then
  patch=$((patch + 1))
fi
version=${minor}.${patch}
echo $version

sed -i "s/\"version\": \".*\",/\"version\": \"$version\",/" mgt2/module.json
sed -i "s#/raw/v[0-9.]*/#/raw/v${version}/#" mgt2/module.json
mkdir -p release

# Build the binary db files. Export to json, clean, then rebuild.
./mkpacks unpack
rm -fr ./mgt2/packs/[a-z]*
./mkpacks pack

# Zip up system archive, minus the source json.
zip -x ./mgt2/packs/_source/\*  -r release/mongoose-traveller.zip ./mgt2
cp mgt2/system.json release/system.json

