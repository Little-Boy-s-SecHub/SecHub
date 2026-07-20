package com.sechub.config;

import com.sechub.support.LocaleHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Populates {@link LocaleHolder} from the {@code Accept-Language} header
 * so every service method can check the preferred language without
 * receiving an explicit parameter.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class LocaleFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            LocaleHolder.set(request.getHeader("Accept-Language"));
            filterChain.doFilter(request, response);
        } finally {
            LocaleHolder.clear();
        }
    }
}
