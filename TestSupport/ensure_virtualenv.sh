VIRTUALENV_PATH=$1

if [ -d "$VIRTUALENV_PATH" ]; then 
	echo "Virtual Env already installed"
else
	python extern/virtualenv/virtualenv.py $VIRTUALENV_PATH
	source $VIRTUALENV_PATH/bin/activate
	pushd TestSupport/sr-testharness/
  env LDFLAGS="-L$(brew --prefix openssl)/lib" CFLAGS="-I$(brew --prefix openssl)/include" pip install cryptography
	python setup.py develop
	popd
fi
