const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

(async function agregarAlimentoCompleto() {
    const clicks = [];
    const logClick = (element) => {
        clicks.push(element);
        console.log(`Clic en: ${element}`);
    };

    const options = new chrome.Options()
        .addArguments('--headless')
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        const startTime = Date.now();

        await driver.manage().setTimeouts({ implicit: 10000 });

        // 1. Ir a la página de login
        console.log("Navegando a la página de login...");
        await driver.get('http://localhost:4200/Login');

        // 2. Ingresar credenciales 
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
        await emailInput.clear();
        await emailInput.sendKeys('cristhopersocalayramirez@gmail.com');

        const passwordInput = await driver.wait(until.elementLocated(By.id('password')), 10000);
        await passwordInput.clear();
        await passwordInput.sendKeys('andressocalay');

        const loginBtn = await driver.wait(until.elementLocated(By.css('form button[type="submit"]')), 10000);
        await driver.wait(async () => {
            const disabled = await loginBtn.getAttribute('disabled');
            return disabled === null;
        }, 10000);

        // Aseguramos que el botón esté en el viewport antes de hacer clic
        await driver.executeScript("arguments[0].scrollIntoView(true);", loginBtn);
        await driver.sleep(500);
        await loginBtn.click();
        logClick('Login');

        // 3. Esperar redirección al Dashboard (la URL cambiará a /Modulo-Galpon/Dashboard)
        await driver.wait(until.urlContains('/Modulo-Galpon/Dashboard'), 15000);
        console.log("Redirigido al Dashboard");

        // 4. Navegar directamente a la página de alimento
        await driver.get('http://localhost:4200/Modulo-Galpon/Alimento');
        console.log("Directamente navegando a /Modulo-Galpon/Alimento");

        // Esperar que se cargue la página de alimento
        await driver.wait(until.elementLocated(By.css('body')), 10000);

        // 5. Clic en botón "Agregar Alimento"
        const abrirModalButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(@class, 'bg-green-500') and contains(., 'Agregar Alimento')]")),
            10000
        );
        await abrirModalButton.click();
        logClick('Abrir Modal Agregar Alimento');

        // 6. Esperar modal y llenar formulario
        await driver.wait(until.elementLocated(By.id('foodType')), 10000);

        // Tipo de alimento
        const foodTypeSelect = await driver.findElement(By.id('foodType'));
        await foodTypeSelect.click();
        const optionInicio = await foodTypeSelect.findElement(By.xpath("./option[text()='Inicio']"));
        await optionInicio.click();
        logClick('Seleccionar Tipo de Alimento');

        // Marca de alimento
        const foodBrandSelect = await driver.findElement(By.id('foodBrand'));
        await foodBrandSelect.click();
        const optionAvifort = await foodBrandSelect.findElement(By.xpath("./option[text()='Avifort']"));
        await optionAvifort.click();
        logClick('Seleccionar Marca de Alimento');

        // Inputs
        const packagingInput = await driver.findElement(By.css('input[name="packaging"]'));
        await packagingInput.clear();
        await packagingInput.sendKeys('Saco');

        const amountInput = await driver.findElement(By.css('input[name="amount"]'));
        await amountInput.clear();
        await amountInput.sendKeys('25');

        const unitMeasureInput = await driver.findElement(By.css('input[name="unitMeasure"]'));
        await unitMeasureInput.clear();
        await unitMeasureInput.sendKeys('kg');

        // 7. Enviar formulario
        const enviarFormularioButton = await driver.wait(
            until.elementLocated(By.xpath("//button[@type='submit' and contains(text(),'Agregar')]")),
            10000
        );
        await enviarFormularioButton.click();
        logClick('Enviar Formulario');

        // 8. Confirmar cierre del modal (esperar que el botón desaparezca)
        await driver.wait(until.stalenessOf(enviarFormularioButton), 10000);

        const endTime = Date.now();
        console.log(`✅ Test exitoso. Duración: ${(endTime - startTime) / 1000} segundos.`);
        console.log(`✅ Total de clics: ${clicks.length}`);

    } catch (err) {
        console.error("❌ Error durante el test:", err);
    } finally {
        await driver.quit();
    }
})();