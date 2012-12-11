clean:
	npm cache clean && rm -rf node_modules/*

install:
	npm install

update:
	make clean && rm -rf npm-shrinkwrap.json && npm install && npm shrinkwrap

test:
	./test/test.sh

integration:
	./node_modules/.bin/mocha -R spec -g Integration

coverage:
	# To install coverage:
	# $ git clone https://github.com/visionmedia/node-jscoverage.git
	# $ cd node-jscoverage
	# $ ./configure && make
	# $ sudo make install
	
	#clean x
	rm -rf coverage && mkdir coverage
	#build the instrumented code with jscoverage
	jscoverage lib coverage/lib-instrumented
	#create the symlink that the unit tests are expecting
	ln -fns ./coverage/lib-instrumented/ ./lib-test
	#run the tests against the instrumented code
	./node_modules/.bin/mocha -R html-cov > ./coverage/coverage.html
	#open the coverage result in the browser
	xdg-open "file://${CURDIR}/coverage/coverage.html" &

.PHONY: test integration coverage
