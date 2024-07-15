#!/bin/bash


function die {
    echo $*
    exit 1
}

if [ ! -d ./mgt2e ]
then
  echo "Cannot find 'mgt2e' system directory"
  exit 2
fi

version=$(cat mgt2e/system.json | jq -r .version)
patch=$(echo $version | sed 's/.*\.//')
minor=$(echo $version | sed 's/[0-9]*\.\([0-9]*\)\.[0-9]*/\1/')
major=$(echo $version | sed 's/\..*//g')

while getopts "Mmpsb" opt
do
  case "${opt}" in
    M)
      major=$((major + 1))
      minor=0
      patch=0
      okay=1
      ;;
    m)
      minor=$((minor + 1))
      patch="0"
      okay=1
      ;;
    p)
      patch=$((patch + 1))
      okay=1
      ;;
    s)
      okay=1
      ;;
    b)
      branch=1
      ;;
    *)
      echo "Unknown option"
      exit 1
      ;;
  esac
done


if [ -z $okay ]
then
  echo "Need to specify one of -M (major), -m (minor), -p (patch), -s (same)"
  exit 1
fi
version=${major}.${minor}.${patch}


# Build the binary db files. Export to json, clean, then rebuild.
./mkpacks unpack || die "Unable to unpack compendiums"
rm -fr ./mgt2e/packs/[a-z]*
./mkpacks pack || die "Unable to pack compendiums"

# If we want to create a branch, do so.
mkdir -p release
if [ ! -z $branch ]
then
  release="v${version}"
  git checkout -b v${version}
  sed -i "s/\"version\": \".*\",/\"version\": \"$version\",/" mgt2e/system.json
  sed -i "s#/raw/[vmain0-9.]*/#/raw/v${version}/#" mgt2e/system.json
else
  release="main"
  sed -i "s/\"version\": \".*\",/\"version\": \"${version}\",/" mgt2e/system.json
  sed -i "s#/raw/[vmain0-9.]*/#/raw/$(git branch --show-current)/#" mgt2e/system.json
fi
# Zip up system archive, minus the source json.
zip -x ./mgt2e/packs/_source/\*  -r release/mongoose-traveller.zip ./mgt2e
cp mgt2e/system.json release/system.json

sed -i "s/\(\*\*Version:\*\* \).*/\1 ${version}/g" README.md

echo "Created release ${version} in branch ${release}"

