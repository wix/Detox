TEST_SCENARIOS="[1-8]*"
TEST_URL='ws://localhost:9001/'

test:

	bash ./TestSupport/run_test.sh $(TEST_SCENARIOS) $(TEST_URL)
	mkdir -p pages/results
	open pages/results/index.html

test_all:

	bash ./TestSupport/run_test.sh '*' $(TEST_URL)
	mkdir -p pages/results
	open pages/results/index.html

