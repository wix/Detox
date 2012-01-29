SDK=iphonesimulator5.0
TEST_KEY=sr_test_fun
TEST_SCENARIOS="[1-8]*"


test:

	bash ./TestSupport/run_test.sh $(TEST_SCENARIOS) $(TEST_KEY) $(SDK)
	open reports/clients/index.html

test_all:

	bash ./TestSupport/run_test.sh '*' $(TEST_KEY) $(SDK)
	open reports/clients/index.html

