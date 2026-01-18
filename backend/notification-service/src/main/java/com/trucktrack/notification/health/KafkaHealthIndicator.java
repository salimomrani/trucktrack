package com.trucktrack.notification.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Health indicator that checks Kafka broker connectivity.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaHealthIndicator implements HealthIndicator {

    private final KafkaAdmin kafkaAdmin;

    @Override
    public Health health() {
        try (AdminClient client = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            long start = System.currentTimeMillis();

            DescribeClusterResult clusterResult = client.describeCluster();
            String clusterId = clusterResult.clusterId().get(5, TimeUnit.SECONDS);
            int nodeCount = clusterResult.nodes().get(5, TimeUnit.SECONDS).size();

            long duration = System.currentTimeMillis() - start;

            return Health.up()
                    .withDetail("kafka", "Connected")
                    .withDetail("clusterId", clusterId)
                    .withDetail("brokerCount", nodeCount)
                    .withDetail("responseTime", duration + "ms")
                    .build();
        } catch (Exception e) {
            log.error("Kafka health check failed", e);
            return Health.down()
                    .withDetail("kafka", "Disconnected")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
