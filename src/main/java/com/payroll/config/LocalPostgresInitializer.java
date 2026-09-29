package com.payroll.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class LocalPostgresInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger LOGGER = LoggerFactory.getLogger(LocalPostgresInitializer.class);
    private static final long COMMAND_TIMEOUT_SECONDS = 30;

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        if (!System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("windows")) {
            return;
        }

        String userProfile = System.getenv("USERPROFILE");
        String localAppData = System.getenv("LOCALAPPDATA");
        if (userProfile == null || localAppData == null) {
            return;
        }

        Path pgCtl = Path.of(userProfile, "Downloads", "postgresql-17.11-4-windows-x64-binaries",
                "pgsql", "bin", "pg_ctl.exe");
        Path dataDirectory = Path.of(localAppData, "PayTrack", "postgres-data");
        if (!Files.isRegularFile(pgCtl) || !Files.isRegularFile(dataDirectory.resolve("PG_VERSION"))) {
            LOGGER.info("Local PostgreSQL auto-start skipped; the expected binaries or data directory were not found.");
            return;
        }

        try {
            if (run(List.of(pgCtl.toString(), "-D", dataDirectory.toString(), "status")) == 0) {
                LOGGER.info("Local PostgreSQL is already running.");
                return;
            }

            LOGGER.info("Starting local PostgreSQL...");
            int exitCode = run(List.of(pgCtl.toString(), "-D", dataDirectory.toString(),
                    "-l", dataDirectory.resolve("server.log").toString(),
                    "-o", "-h localhost -p 5432", "-w", "start"));
            if (exitCode != 0) {
                throw new IllegalStateException("pg_ctl failed to start local PostgreSQL (exit code " + exitCode + ").");
            }
            LOGGER.info("Local PostgreSQL started.");
        } catch (IOException exception) {
            throw new IllegalStateException("Could not run pg_ctl to start local PostgreSQL.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while starting local PostgreSQL.", exception);
        }
    }

    private static int run(List<String> command) throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command).inheritIO().start();
        if (!process.waitFor(COMMAND_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            throw new IllegalStateException("Timed out while running pg_ctl.");
        }
        return process.exitValue();
    }
}