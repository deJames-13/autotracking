#!/usr/bin/env node

/**
 * AutoTracking System Setup Script
 * Checks and installs dependencies, handles updates, and manages the project setup
 * 
 * Author: GitHub Copilot
 * Date: June 16, 2025
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Utility functions
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
    step: (msg) => console.log(`${colors.magenta}→${colors.reset} ${msg}`)
};

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Project root directory
const projectRoot = __dirname;

/**
 * Execute command with error handling
 */
function execCommand(command, options = {}) {
    try {
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        return { success: true, output: result };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            output: error.stdout || error.stderr || error.message
        };
    }
}

/**
 * Check if a command exists
 */
function commandExists(command) {
    try {
        execSync(isWindows ? `where ${command}` : `which ${command}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get version of a command
 */
function getVersion(command, versionFlag = '--version') {
    try {
        const result = execSync(`${command} ${versionFlag}`, { encoding: 'utf8', stdio: 'pipe' });
        return result.trim().split('\n')[0];
    } catch {
        return 'Unknown version';
    }
}

/**
 * Check Node.js installation
 */
function checkNode() {
    log.step('Checking Node.js installation...');

    if (!commandExists('node')) {
        log.error('Node.js is not installed!');
        log.info('Please install Node.js from: https://nodejs.org/');
        log.info('This script requires Node.js to run.');
        process.exit(1);
    }

    const nodeVersion = getVersion('node', '--version');
    log.success(`Node.js found: ${nodeVersion}`);

    // Check if npm is available
    if (!commandExists('npm')) {
        log.error('npm is not installed!');
        log.info('npm should come with Node.js. Please reinstall Node.js.');
        process.exit(1);
    }

    const npmVersion = getVersion('npm', '--version');
    log.success(`npm found: ${npmVersion}`);

    return true;
}

/**
 * Check PHP installation
 */
function checkPHP() {
    log.step('Checking PHP installation...');

    if (!commandExists('php')) {
        if (isWindows) {
            log.warning('PHP not found. Attempting to install PHP for Windows...');
            return installPHPWindows();
        } else {
            log.error('PHP is not installed!');
            log.info('Please install PHP 8.2+ from your package manager:');
            log.info('  Ubuntu/Debian: sudo apt install php8.2 php8.2-cli php8.2-mbstring php8.2-xml php8.2-zip php8.2-mysql php8.2-curl php8.2-bcmath');
            log.info('  macOS: brew install php');
            return false;
        }
    }

    const phpVersion = getVersion('php', '--version');
    log.success(`PHP found: ${phpVersion}`);

    // Check PHP version (should be 8.2+)
    const versionMatch = phpVersion.match(/PHP (\d+)\.(\d+)/);
    if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        if (major < 8 || (major === 8 && minor < 2)) {
            log.warning(`PHP version ${major}.${minor} detected. PHP 8.2+ is recommended.`);
        }
    }

    return true;
}

/**
 * Install PHP on Windows using Chocolatey
 */
function installPHPWindows() {
    try {
        log.step('Checking for Chocolatey...');

        if (!commandExists('choco')) {
            log.info('Installing Chocolatey package manager...');
            const chocoInstall = `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`;

            const result = execCommand(`powershell -Command "${chocoInstall}"`, { stdio: 'inherit' });
            if (!result.success) {
                log.error('Failed to install Chocolatey. Please install PHP manually.');
                return false;
            }
        }

        log.step('Installing PHP via Chocolatey...');
        const result = execCommand('choco install php -y', { stdio: 'inherit' });

        if (result.success) {
            log.success('PHP installed successfully!');
            // Refresh PATH
            execCommand('refreshenv');
            return true;
        } else {
            log.error('Failed to install PHP via Chocolatey.');
            return false;
        }
    } catch (error) {
        log.error(`Error installing PHP: ${error.message}`);
        return false;
    }
}

/**
 * Check Composer installation
 */
function checkComposer() {
    log.step('Checking Composer installation...');

    if (!commandExists('composer')) {
        if (isWindows) {
            log.warning('Composer not found. Attempting to install Composer for Windows...');
            return installComposerWindows();
        } else {
            log.error('Composer is not installed!');
            log.info('Please install Composer from: https://getcomposer.org/');
            log.info('  curl -sS https://getcomposer.org/installer | php');
            log.info('  sudo mv composer.phar /usr/local/bin/composer');
            return false;
        }
    }

    const composerVersion = getVersion('composer', '--version');
    log.success(`Composer found: ${composerVersion}`);

    return true;
}

/**
 * Install Composer on Windows
 */
function installComposerWindows() {
    try {
        log.step('Installing Composer for Windows...');

        if (commandExists('choco')) {
            const result = execCommand('choco install composer -y', { stdio: 'inherit' });
            if (result.success) {
                log.success('Composer installed successfully via Chocolatey!');
                execCommand('refreshenv');
                return true;
            }
        }

        // Fallback: Download installer
        log.step('Downloading Composer installer...');
        const result = execCommand('powershell -Command "Invoke-WebRequest -Uri https://getcomposer.org/Composer-Setup.exe -OutFile composer-setup.exe"');

        if (result.success) {
            log.info('Please run composer-setup.exe to complete Composer installation.');
            log.info('After installation, restart this script.');
            return false;
        }

        log.error('Failed to download Composer installer.');
        return false;
    } catch (error) {
        log.error(`Error installing Composer: ${error.message}`);
        return false;
    }
}

/**
 * Check for Git and handle updates
 */
function checkGitAndUpdates() {
    log.step('Checking Git installation...');

    if (!commandExists('git')) {
        log.warning('Git is not installed. Skipping repository updates.');
        return true;
    }

    const gitVersion = getVersion('git', '--version');
    log.success(`Git found: ${gitVersion}`);

    // Check if we're in a git repository
    const gitStatus = execCommand('git status', { silent: true });
    if (!gitStatus.success) {
        log.warning('Not in a Git repository. Skipping updates.');
        return true;
    }

    log.step('Checking for updates from remote repository...');

    // Fetch latest changes
    const fetchResult = execCommand('git fetch origin', { silent: true });
    if (!fetchResult.success) {
        log.warning('Failed to fetch from remote. Continuing with local setup.');
        return true;
    }

    // Check if there are updates
    const statusResult = execCommand('git status -uno', { silent: true });
    if (statusResult.output.includes('behind')) {
        log.warning('Repository is behind remote. Consider pulling latest changes.');
        log.info('Run: git pull origin main');
    } else {
        log.success('Repository is up to date.');
    }

    return true;
}

/**
 * Install Composer dependencies
 */
function installComposerDependencies() {
    log.step('Installing Composer dependencies...');

    if (!fs.existsSync(path.join(projectRoot, 'composer.json'))) {
        log.error('composer.json not found!');
        return false;
    }

    const result = execCommand('composer install --optimize-autoloader', { cwd: projectRoot });

    if (result.success) {
        log.success('Composer dependencies installed successfully!');
        return true;
    } else {
        log.error('Failed to install Composer dependencies.');
        log.error(result.error);
        return false;
    }
}

/**
 * Install npm dependencies
 */
function installNpmDependencies() {
    log.step('Installing npm dependencies...');

    if (!fs.existsSync(path.join(projectRoot, 'package.json'))) {
        log.error('package.json not found!');
        return false;
    }

    const result = execCommand('npm install', { cwd: projectRoot });

    if (result.success) {
        log.success('npm dependencies installed successfully!');
        return true;
    } else {
        log.error('Failed to install npm dependencies.');
        log.error(result.error);
        return false;
    }
}

/**
 * Setup Laravel environment
 */
function setupLaravelEnvironment() {
    log.step('Setting up Laravel environment...');

    // Check if .env exists
    const envPath = path.join(projectRoot, '.env');
    const envExamplePath = path.join(projectRoot, '.env.example');

    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(envExamplePath)) {
            log.step('Creating .env file from .env.example...');
            fs.copyFileSync(envExamplePath, envPath);
            log.success('.env file created!');
        } else {
            log.warning('.env.example not found. You may need to create .env manually.');
        }
    } else {
        log.success('.env file already exists.');
    }

    // Generate application key if needed
    log.step('Generating application key...');
    const keyResult = execCommand('php artisan key:generate', { cwd: projectRoot });

    if (keyResult.success) {
        log.success('Application key generated!');
    } else {
        log.warning('Failed to generate application key. You may need to do this manually.');
    }

    return true;
}

/**
 * Build frontend assets
 */
function buildAssets() {
    log.step('Building frontend assets...');

    const result = execCommand('npm run build', { cwd: projectRoot });

    if (result.success) {
        log.success('Frontend assets built successfully!');
        return true;
    } else {
        log.error('Failed to build frontend assets.');
        log.error(result.error);
        return false;
    }
}

/**
 * Update packages
 */
function updatePackages() {
    log.step('Updating Composer packages...');

    const composerResult = execCommand('composer update', { cwd: projectRoot });
    if (composerResult.success) {
        log.success('Composer packages updated!');
    } else {
        log.warning('Failed to update Composer packages.');
    }

    log.step('Updating npm packages...');

    const npmResult = execCommand('npm update', { cwd: projectRoot });
    if (npmResult.success) {
        log.success('npm packages updated!');
    } else {
        log.warning('Failed to update npm packages.');
    }

    return true;
}

/**
 * Main setup function
 */
async function runSetup() {
    try {
        log.header('🚀 AutoTracking System Setup');
        log.info('This script will check and install dependencies for the AutoTracking system.');
        log.info(`Platform: ${os.platform()} ${os.arch()}`);
        log.info(`Node.js version: ${process.version}`);

        // Check required dependencies
        log.header('📋 Checking Dependencies');

        const nodeOk = checkNode();
        const phpOk = checkPHP();
        const composerOk = checkComposer();
        const gitOk = checkGitAndUpdates();

        if (!nodeOk || !phpOk || !composerOk) {
            log.error('Some required dependencies are missing. Please install them and run this script again.');
            process.exit(1);
        }

        // Install project dependencies
        log.header('📦 Installing Project Dependencies');

        const composerInstall = installComposerDependencies();
        const npmInstall = installNpmDependencies();

        if (!composerInstall || !npmInstall) {
            log.error('Failed to install some dependencies. Check the errors above.');
            process.exit(1);
        }

        // Setup Laravel environment
        log.header('⚙️ Setting up Laravel Environment');
        setupLaravelEnvironment();

        // Build assets
        log.header('🏗️ Building Frontend Assets');
        buildAssets();

        // Ask about updates
        if (process.argv.includes('--update')) {
            log.header('🔄 Updating Packages');
            updatePackages();
        }

        // Final success message
        log.header('🎉 Setup Complete!');
        log.success('AutoTracking system is ready for development.');
        log.info('');
        log.info('Next steps:');
        log.info('1. Configure your database settings in .env');
        log.info('2. Run: php artisan migrate --seed');
        log.info('3. Start development server: php artisan serve');
        log.info('4. Visit: http://localhost:8000');
        log.info('');
        log.info('For more information, see resources/README.md');

    } catch (error) {
        log.error(`Setup failed: ${error.message}`);
        log.error('Please check the error above and try again.');
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    log.warning('\nSetup interrupted by user.');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    log.error(`Uncaught exception: ${error.message}`);
    process.exit(1);
});

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSetup();
}

export {
    runSetup,
    checkNode,
    checkPHP,
    checkComposer,
    installComposerDependencies,
    installNpmDependencies
};