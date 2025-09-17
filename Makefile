.PHONY: setup dev seed test build start lint

setup:
	npm install
	npm run db:migrate
	npm run db:seed --if-present
	echo "Setup complete"

dev:
	npm run dev

seed:
	npm run db:seed

lint:
	npm run lint

test:
	npm run test
	npm run test:e2e

build:
	npm run build

start:
	npm run start
