# Path to executables
MOCHA = ./node_modules/mocha/bin/mocha

MOCHA_OPTS = --recursive \
    --compilers js:babel-register,css:test/css-null-compiler.js \
    --require ./test/setup.js \
    --timeout 25000

TEST = $(MOCHA) \
	-u bdd \
	--reporter spec \
	$(MOCHA_OPTS)

REPORT_OUTPUT=$(TEST_OUTPUT_PATH)
ifndef TEST_OUTPUT_PATH
	REPORT_OUTPUT=.
endif

LINT = ./node_modules/eslint/bin/eslint.js

LINT_OPTS = src server

check: test

test:
	@$(TEST)

jenkins:
	@JUNIT_REPORT_PATH=$(REPORT_OUTPUT)/report.xml $(MOCHA) \
	    -u bdd \
	    --reporter mocha-jenkins-reporter \
	    $(MOCHA_OPTS) \
	    --no-colors \
	    || true
	$(LINT) $(LINT_OPTS) \
	    --output-file $(REPORT_OUTPUT)/eslint.xml \
	    -f checkstyle \
	    || true

lint:
	$(LINT) $(LINT_OPTS)


.PHONY: test jenkins lint
