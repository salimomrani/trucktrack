package com.trucktrack.location.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * T033: Web MVC configuration for registering interceptors.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final CacheHeaderInterceptor cacheHeaderInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Register cache header interceptor for admin API endpoints
        registry.addInterceptor(cacheHeaderInterceptor)
            .addPathPatterns("/admin/**", "/location/v1/**")
            .excludePathPatterns("/admin/cache/**"); // Exclude cache admin endpoints
    }
}
