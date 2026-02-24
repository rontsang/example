package com.example.demo.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

public final class SystemOutLogger {
    private static final Logger outLog = LoggerFactory.getLogger("STDOUT");
    private static final Logger errLog = LoggerFactory.getLogger("STDERR");

    private SystemOutLogger() {
    }

    public static void install() {
        System.setOut(new PrintStream(new LoggingOutputStream(outLog), true, StandardCharsets.UTF_8));
        System.setErr(new PrintStream(new LoggingOutputStream(errLog), true, StandardCharsets.UTF_8));
    }

    private static final class LoggingOutputStream extends ByteArrayOutputStream {
        private final Logger logger;

        private LoggingOutputStream(Logger logger) {
            this.logger = logger;
        }

        @Override
        public synchronized void flush() {
            String message = toString(StandardCharsets.UTF_8);
            reset();

            String trimmed = message.trim();
            if (!trimmed.isEmpty()) {
                logger.info(trimmed);
            }
        }
    }
}
