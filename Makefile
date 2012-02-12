TEST_KEY=sr_test_fun
TEST_SCENARIOS="[1-8]*"

test:

	bash ./TestSupport/run_test.sh $(TEST_SCENARIOS) $(TEST_KEY)
	mkdir -p pages/results
	open pages/results/index.html

test_all:

	bash ./TestSupport/run_test.sh '*' $(TEST_KEY) $(SDK)
	mkdir -p pages/results
	open pages/results/index.html

