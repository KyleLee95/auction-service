docker run -d \
	--name=auction-service-db -e POSTGRES_DB=auction-service-db \
	-e POSTGRES_PASSWORD=password \
	-e POSTGRES_USER=postgres \
	-p "5431:5432" postgres
