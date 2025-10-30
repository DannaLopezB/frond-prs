const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

// Función para generar reporte HTML con botón de descarga
function generateHTMLReport(testData) {
    const { status, duration, clicks, steps, error, debugInfo, startTime } = testData;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Test Vacunas - ${new Date().toLocaleDateString()}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-4xl mx-auto p-6">
        <!-- Header con botón de descarga -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">🧪 Reporte Test Automatizado</h1>
                    <p class="text-gray-600">Agregar Vacuna Completa - ${new Date(startTime).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="inline-block px-4 py-2 rounded-full text-white font-semibold ${status === 'success' ? 'bg-green-500' : 'bg-red-500'}">
                        ${status === 'success' ? '✅ EXITOSO' : '❌ FALLIDO'}
                    </span>
                    <button onclick="downloadReport()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                        📥 Descargar Reporte
                    </button>
                </div>
            </div>
        </div>

        <!-- Métricas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-blue-600">${duration}s</div>
                <div class="text-sm text-gray-600">Duración</div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-purple-600">${clicks.length}</div>
                <div class="text-sm text-gray-600">Clics</div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-green-600">${steps.filter(s => s.status === 'success').length}</div>
                <div class="text-sm text-gray-600">Pasos Exitosos</div>
            </div>
        </div>

        ${error ? `
        <!-- Error -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 class="text-red-800 font-semibold mb-2">❌ Error Encontrado</h3>
            <p class="text-red-700">${error}</p>
            ${debugInfo ? `
            <div class="mt-3 p-3 bg-red-100 rounded text-sm">
                <p><strong>URL:</strong> ${debugInfo.url}</p>
                <p><strong>Título:</strong> ${debugInfo.title}</p>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <!-- Pasos -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">📋 Pasos Ejecutados</h2>
            <div class="space-y-2">
                ${steps.map(step => `
                <div class="flex items-center p-3 rounded-lg ${step.status === 'success' ? 'bg-green-50 border-l-4 border-green-400' : step.status === 'error' ? 'bg-red-50 border-l-4 border-red-400' : 'bg-yellow-50 border-l-4 border-yellow-400'}">
                    <span class="mr-3">${step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⚠️'}</span>
                    <div class="flex-1">
                        <div class="font-medium">${step.name}</div>
                        <div class="text-sm text-gray-600">${step.details}</div>
                    </div>
                    <span class="text-xs text-gray-500">${step.duration}s</span>
                </div>
                `).join('')}
            </div>
        </div>

        <!-- Clics -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">🖱️ Secuencia de Clics</h2>
            <div class="flex flex-wrap gap-2">
                ${clicks.map((click, i) => `
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    ${i + 1}. ${click}
                </span>
                `).join('')}
            </div>
        </div>

        <!-- Botones de acción -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">📤 Acciones</h2>
            <div class="flex flex-wrap gap-3">
                <button onclick="downloadReport()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    📥 Descargar HTML
                </button>
                <button onclick="downloadJSON()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    📊 Descargar JSON
                </button>
                <button onclick="printReport()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    🖨️ Imprimir
                </button>
                <button onclick="shareReport()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    📤 Compartir
                </button>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6 text-gray-500 text-sm">
            <p>Generado automáticamente el ${new Date().toLocaleString()}</p>
            <p class="mt-1">Sistema de Gestión de Galpones - Módulo de Vacunas</p>
        </div>
    </div>

    <script>
        // Datos del test para descarga
        const testData = ${JSON.stringify(testData, null, 2)};

        function downloadReport() {
            const element = document.createElement('a');
            const htmlContent = document.documentElement.outerHTML;
            const file = new Blob([htmlContent], {type: 'text/html'});
            element.href = URL.createObjectURL(file);
            element.download = 'reporte-vacunas-${new Date().toISOString().split('T')[0]}.html';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            
            // Mostrar notificación
            showNotification('📥 Reporte HTML descargado exitosamente', 'success');
        }

        function downloadJSON() {
            const element = document.createElement('a');
            const file = new Blob([JSON.stringify(testData, null, 2)], {type: 'application/json'});
            element.href = URL.createObjectURL(file);
            element.download = 'datos-test-vacunas-${new Date().toISOString().split('T')[0]}.json';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            
            showNotification('📊 Datos JSON descargados exitosamente', 'success');
        }

        function printReport() {
            window.print();
            showNotification('🖨️ Enviando a impresora...', 'info');
        }

        function shareReport() {
            if (navigator.share) {
                navigator.share({
                    title: 'Reporte Test Automatizado - Vacunas',
                    text: 'Reporte de test automatizado para agregar vacunas',
                    url: window.location.href
                });
            } else {
                // Fallback: copiar URL al clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showNotification('📤 URL copiada al portapapeles', 'success');
                });
            }
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-all duration-300 \${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                'bg-blue-500'
            }\`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Animación de entrada
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
                notification.style.opacity = '1';
            }, 100);
            
            // Remover después de 3 segundos
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Atajos de teclado
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        downloadReport();
                        break;
                    case 'p':
                        e.preventDefault();
                        printReport();
                        break;
                    case 'j':
                        e.preventDefault();
                        downloadJSON();
                        break;
                }
            }
        });

        // Mostrar atajos al cargar
        window.addEventListener('load', function() {
            showNotification('💡 Atajos: Ctrl+S (Descargar), Ctrl+P (Imprimir), Ctrl+J (JSON)', 'info');
        });
    </script>
</body>
</html>`;
}

// Función para guardar reporte
function saveReport(htmlContent) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte-vacunas-${timestamp}.html`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, htmlContent);
    console.log(`📄 Reporte guardado: ${filepath}`);
    return filepath;
}

// Función para abrir automáticamente el reporte
function openReport(filepath) {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    if (platform === 'win32') {
        command = `start "" "${filepath}"`;
    } else if (platform === 'darwin') {
        command = `open "${filepath}"`;
    } else {
        command = `xdg-open "${filepath}"`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.log(`⚠️  No se pudo abrir automáticamente. Abre manualmente: ${filepath}`);
        } else {
            console.log(`🌐 Reporte abierto en el navegador`);
        }
    });
}

(async function agregarVacunaCompleta() {
    const testData = {
        startTime: Date.now(),
        clicks: [],
        steps: [],
        status: 'success',
        duration: 0,
        error: null,
        debugInfo: null
    };

    const logClick = (element) => {
        testData.clicks.push(element);
        console.log(`✅ Clic en: ${element}`);
    };

    const logStep = (name, details, status = 'success', duration = 0) => {
        testData.steps.push({ name, details, status, duration });
        console.log(`${status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'} ${name}: ${details}`);
    };

    const options = new chrome.Options()
        .addArguments('--headless')
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage')
        .addArguments('--disable-gpu')
        .addArguments('--window-size=1920,1080');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        const startTime = Date.now();
        await driver.manage().setTimeouts({ implicit: 15000 });

        // 1. Login
        console.log("🔐 Navegando a la página de login...");
        await driver.get('http://localhost:4200/Login');
        logStep('Navegación Login', 'Acceso a página de login exitoso');

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 15000);
        await emailInput.clear();
        await emailInput.sendKeys('cristhopersocalayramirez@gmail.com');

        const passwordInput = await driver.wait(until.elementLocated(By.id('password')), 15000);
        await passwordInput.clear();
        await passwordInput.sendKeys('andressocalay');

        const loginBtn = await driver.wait(until.elementLocated(By.css('form button[type="submit"]')), 15000);
        await driver.wait(async () => {
            const disabled = await loginBtn.getAttribute('disabled');
            return disabled === null;
        }, 15000);

        await driver.executeScript("arguments[0].scrollIntoView(true);", loginBtn);
        await driver.sleep(1000);
        await loginBtn.click();
        logClick('Login');
        logStep('Autenticación', 'Credenciales ingresadas y login exitoso');

        // 2. Dashboard
        await driver.wait(until.urlContains('/Modulo-Galpon/Dashboard'), 20000);
        logStep('Redirección Dashboard', 'Acceso al dashboard confirmado');

        // 3. Página de vacunas
        await driver.get('http://localhost:4200/Modulo-Galpon/Vacunas');
        await driver.sleep(3000);
        logStep('Navegación Vacunas', 'Acceso a módulo de vacunas');

        // 4. Verificar página
        let pageLoaded = false;
        const verificationStrategies = [
            async () => {
                try {
                    await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Lista de Vacunas')]")), 5000);
                    return true;
                } catch (e) { return false; }
            },
            async () => {
                try {
                    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Agregar Vacunas')]")), 5000);
                    return true;
                } catch (e) { return false; }
            }
        ];

        for (let i = 0; i < verificationStrategies.length; i++) {
            if (await verificationStrategies[i]()) {
                pageLoaded = true;
                break;
            }
        }

        if (!pageLoaded) {
            throw new Error('No se pudo cargar la página de vacunas correctamente');
        }
        logStep('Verificación Página', 'Página de vacunas cargada correctamente');

        // 5. Abrir modal
        const buttonSelectors = [
            "//button[contains(@class, 'bg-green-500') and contains(., 'Agregar Vacunas')]",
            "//button[contains(., 'Agregar Vacunas')]"
        ];

        let abrirModalButton = null;
        for (const selector of buttonSelectors) {
            try {
                abrirModalButton = await driver.wait(until.elementLocated(By.xpath(selector)), 5000);
                break;
            } catch (e) { continue; }
        }

        if (!abrirModalButton) {
            throw new Error('No se pudo encontrar el botón "Agregar Vacunas"');
        }

        await driver.executeScript("arguments[0].scrollIntoView(true);", abrirModalButton);
        await driver.sleep(1000);
        await abrirModalButton.click();
        logClick('Abrir Modal Agregar Vacuna');
        logStep('Apertura Modal', 'Modal de agregar vacuna abierto');

        // 6. Llenar formulario
        const waitForField = async (fieldId, fieldName) => {
            try {
                const field = await driver.wait(until.elementLocated(By.id(fieldId)), 10000);
                return field;
            } catch (e) {
                const field = await driver.wait(until.elementLocated(By.name(fieldId)), 5000);
                return field;
            }
        };

        const formData = [
            ['nameVaccine', 'Vacuna Newcastle Test', 'Nombre de Vacuna'],
            ['typeVaccine', 'Viral', 'Tipo de Vacuna'],
            ['description', 'Vacuna de prueba automatizada', 'Descripción'],
            ['amountMl', '100', 'Cantidad mL'],
            ['doseAmount', '50', 'Dosis'],
            ['manufacturingDate', '2024-01-15', 'Fecha de Fabricación'],
            ['expirationDate', '2025-01-15', 'Fecha de Expiración'],
            ['price', '25.50', 'Precio'],
            ['stock', '100', 'Stock']
        ];

        for (const [fieldId, value, name] of formData) {
            const input = await waitForField(fieldId, name);
            await input.clear();
            await input.sendKeys(value);
            logClick(name);
        }
        logStep('Llenado Formulario', 'Todos los campos completados exitosamente');

        // 7. Enviar formulario
        const submitSelectors = [
            "//button[@type='submit' and contains(text(),'Agregar')]",
            "//button[contains(text(),'Agregar')]"
        ];

        let enviarFormularioButton = null;
        for (const selector of submitSelectors) {
            try {
                enviarFormularioButton = await driver.wait(until.elementLocated(By.xpath(selector)), 5000);
                break;
            } catch (e) { continue; }
        }

        if (!enviarFormularioButton) {
            throw new Error('No se pudo encontrar el botón de enviar formulario');
        }

        await driver.executeScript("arguments[0].scrollIntoView(true);", enviarFormularioButton);
        await driver.sleep(1000);
        await enviarFormularioButton.click();
        logClick('Enviar Formulario');
        logStep('Envío Formulario', 'Formulario enviado exitosamente');

        // 8. Verificar cierre modal
        try {
            await driver.wait(until.stalenessOf(enviarFormularioButton), 15000);
            logStep('Cierre Modal', 'Modal cerrado correctamente');
        } catch (e) {
            logStep('Cierre Modal', 'No se pudo confirmar cierre del modal', 'warning');
        }

        await driver.sleep(3000);
        const endTime = Date.now();
        testData.duration = ((endTime - startTime) / 1000).toFixed(1);

        console.log(`\n🎉 ¡TEST COMPLETADO EXITOSAMENTE!`);
        console.log(`⏱️  Duración total: ${testData.duration} segundos`);
        console.log(`🖱️  Total de clics realizados: ${testData.clicks.length}`);

    } catch (err) {
        testData.status = 'error';
        testData.error = err.message;
        
        console.error("\n❌ ERROR DURANTE EL TEST:");
        console.error(err.message);
        
        try {
            const currentUrl = await driver.getCurrentUrl();
            const pageTitle = await driver.getTitle();
            testData.debugInfo = { url: currentUrl, title: pageTitle };
            
            logStep('Error Capturado', err.message, 'error');
            console.log(`📍 URL actual: ${currentUrl}`);
            console.log(`📄 Título de página: ${pageTitle}`);
        } catch (debugErr) {
            console.error("❌ Error al capturar información de debug:", debugErr.message);
        }
    } finally {
        await driver.quit();
        
        // Generar y guardar reporte
        const htmlReport = generateHTMLReport(testData);
        const reportPath = saveReport(htmlReport);
        
        // Abrir automáticamente el reporte
        openReport(reportPath);
        
        console.log("🔚 Driver cerrado");
        console.log(`📊 Reporte HTML generado: ${reportPath}`);
        console.log(`💡 El reporte incluye botones para descargar en diferentes formatos`);
    }
})();

console.log("🚀 SCRIPT DE AUTOMATIZACIÓN DE VACUNAS CON DESCARGA");
console.log("🔧 Características:");
console.log("   ✅ Generación automática de reportes HTML");
console.log("   ✅ Botones de descarga integrados");
console.log("   ✅ Múltiples formatos (HTML, JSON)");
console.log("   ✅ Apertura automática del reporte");
console.log("   ✅ Atajos de teclado (Ctrl+S, Ctrl+P, Ctrl+J)");
console.log("\n⚡ Ejecutando automáticamente...");