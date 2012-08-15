TEST_SCENARIOS="[1-8]*"
TEST_URL='ws://localhost:9001/'

test:

	mkdir -p pages/results
	bash ./TestSupport/run_test.sh $(TEST_SCENARIOS) $(TEST_URL) Debug || open pages/results/index.html && false
	open pages/results/index.html

test_all:

	mkdir -p pages/results
	bash ./TestSupport/run_test.sh '*' $(TEST_URL) Debug || open pages/results/index.html && false
	open pages/results/index.html

test_perf:

	mkdir -p pages/results
	bash ./TestSupport/run_test.sh '9.*' $(TEST_URL) Release || open pages/results/index.html && false
	open pages/results/index.html
