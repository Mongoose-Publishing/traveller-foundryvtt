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

if [ -f .env ]
then
  . ./.env
fi

version=$(cat mgt2e/system.json | jq -r .version)
build=$(echo $version | cut -d "." -f 4 | sed 's/[^0-9]//g')
patch=$(echo $version | cut -d "." -f 3)
minor=$(echo $version | cut -d "." -f 2)
major=$(echo $version | cut -d "." -f 1)

# Build gets incremented every time this script runs.
build=$((build + 1))

LOCAL=no
while getopts "LMmpsb" opt
do
  case "${opt}" in
    L)
      LOCAL=yes
      ;;
    M)
      major=$((major + 1))
      minor=0
      patch=0
      build=0
      okay=1
      ;;
    m)
      minor=$((minor + 1))
      patch=0
      build=0
      okay=1
      ;;
    p)
      patch=$((patch + 1))
      build=0
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
#rm -fr ./mgt2e/packs/[a-z]*
#./mkpacks pack || die "Unable to pack compendiums"

# If we want to create a branch, do so.
mkdir -p release
if [ ! -z $branch ]
then
  release="v${version}"
  git checkout -b v${version}
fi

release=$(git branch --show-current)

RELEASE_DOWNLOAD_URL="https://github.com/Mongoose-Publishing/traveller-foundryvtt/raw/${release}/release/mongoose-traveller.zip"
RELEASE_MANIFEST_URL="https://github.com/Mongoose-Publishing/traveller-foundryvtt/raw/latest/release/system.json"
RELEASE_URL="https://github.com/Mongoose-Publishing/traveller-foundryvtt/"

# Zip up system archive, minus the source json.
if [ $LOCAL = "yes" ]
then
  echo "Publishing locally to $LOCAL_PUBLISH_DIR"
  sed -i "s/\"version\": \".*\",/\"version\": \"${version}.${build}-DEV\",/" mgt2e/system.json
  sed -i "s#\"download\": .*#\"download\": \"$LOCAL_DOWNLOAD_URL\",#" mgt2e/system.json
  sed -i "s#\"manifest\": .*#\"manifest\": \"$LOCAL_MANIFEST_URL\",#" mgt2e/system.json
  sed -i "s#\"url\": .*foundry.*#\"url\": \"$LOCAL_URL\",#" mgt2e/system.json

  rm -f release/mongoose-traveller.zip
  zip -x ./mgt2e/packs/_source/\*  -r release/mongoose-traveller.zip ./mgt2e
  cp mgt2e/system.json release/system.json

  cp -p release/* $LOCAL_PUBLISH_DIR

else
  echo "Creating release files"
  sed -i "s/\"version\": \".*\",/\"version\": \"${version}.${build}\",/" mgt2e/system.json
  sed -i "s#\"download\": .*#\"download\": \"$RELEASE_DOWNLOAD_URL\",#" mgt2e/system.json
  sed -i "s#\"manifest\": .*#\"manifest\": \"$RELEASE_MANIFEST_URL\",#" mgt2e/system.json
  sed -i "s#\"url\": .*foundry.*#\"url\": \"$RELEASE_URL\",#" mgt2e/system.json

  cat mgt2e/system.json jq empty || die "There is an error with the system.json"

  rm -f release/mongoose-traveller.zip
  sleep 1
  zip -x ./mgt2e/packs/_source/\*  -r release/mongoose-traveller.zip ./mgt2e
  cp mgt2e/system.json release/system.json

  sed -i "s/\(\*\*Version:\*\* \).*/\1 ${version}/g" README.md
  echo "Created release ${version} in branch ${release}"
fi


