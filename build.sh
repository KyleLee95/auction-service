docker run -d -e POSTGRES_DB=auction-service-db \
	-e POSTGRES_PASSWORD=password \
	-e POSTGRES_USER=postgres \
	-p "8080:5432" postgres
