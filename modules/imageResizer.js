const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Redimensiona uma imagem para preencher totalmente um card de jogo em proporção 9:16
 * @param {string} inputPath - Caminho da imagem original
 * @param {string} outputPath - Caminho onde a imagem redimensionada será salva
 * @param {number} width - Largura desejada (padrão: 900px)
 * @param {number} height - Altura desejada (padrão: 1600px para 9:16)
 * @returns {Promise<string>} - Caminho da imagem redimensionada
 */
async function resizeGameCover(inputPath, outputPath, width = 900, height = 1600) {
    try {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Arquivo não encontrado: ${inputPath}`);
        }

        // Cria o diretório de output se não existir
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Redimensiona a imagem para preencher o card em proporção 9:16
        await sharp(inputPath)
            .resize(width, height, {
                fit: 'cover',
                position: 'center',
                withoutEnlargement: false // Permite aumentar imagens pequenas
            })
            .jpeg({ 
                quality: 90, 
                chromaSubsampling: '4:4:4', // Melhor qualidade de cor
                mozjpeg: true // Otimização adicional
            })
            .toFile(outputPath);
        
        console.log(`Imagem redimensionada (${width}x${height}) salva em: ${outputPath}`);
        return outputPath;
        
    } catch (error) {
        console.error('Erro ao redimensionar a imagem:', error.message);
        throw error;
    }
}

/**
 * Função para detectar a orientação da imagem e redimensionar adequadamente
 * @param {string} inputPath - Caminho da imagem original
 * @param {string} outputPath - Caminho onde a imagem redimensionada será salva
 * @param {Object} options - Opções de redimensionamento
 * @returns {Promise<string>} - Caminho da imagem redimensionada
 */
async function smartResizeGameCover(inputPath, outputPath, options = {}) {
    const {
        portraitWidth = 900,
        portraitHeight = 1600
    } = options;
    
    try {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Arquivo não encontrado: ${inputPath}`);
        }

        // Cria o diretório de output se não existir
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Sempre usa proporção 9:16, independentemente da orientação original
        return await resizeGameCover(inputPath, outputPath, portraitWidth, portraitHeight);
        
    } catch (error) {
        console.error('Erro ao redimensionar a imagem:', error.message);
        throw error;
    }
}

/**
 * Processa múltiplas resoluções para uma imagem (para responsividade)
 * @param {string} inputPath - Caminho da imagem original
 * @param {string} outputBasePath - Caminho base para as imagens redimensionadas
 * @returns {Promise<Object>} - Objeto com caminhos das diferentes resoluções
 */
async function createResponsiveGameCovers(inputPath, outputBasePath) {
    try {
        const resolutions = [
            { width: 900, height: 1600, suffix: 'xl' },
            { width: 675, height: 1200, suffix: 'lg' },
            { width: 450, height: 800, suffix: 'md' },
            { width: 270, height: 480, suffix: 'sm' }
        ];
        
        const results = {};
        
        for (const res of resolutions) {
            const outputPath = outputBasePath.replace('.jpg', `_${res.suffix}.jpg`);
            results[res.suffix] = await resizeGameCover(inputPath, outputPath, res.width, res.height);
        }
        
        return results;
    } catch (error) {
        console.error('Erro ao criar imagens responsivas:', error.message);
        throw error;
    }
}

// Exemplo de uso
async function exampleUsage() {
    try {
        // Redimensiona uma imagem para caber em um card 9:16 em alta resolução
        await resizeGameCover('./input/image.jpg', './output/game-cover.jpg');
        
        // Redimensionamento para proporção 9:16
        await smartResizeGameCover('./input/image.jpg', './output/game-cover-9-16.jpg');
        
        // Criar múltiplas resoluções para responsividade
        await createResponsiveGameCovers('./input/image.jpg', './output/game-cover-responsive.jpg');
        
    } catch (error) {
        console.error('Erro no exemplo:', error);
    }
}

// Exporta as funções para uso em outros módulos
module.exports = {
    resizeGameCover,
    smartResizeGameCover,
    createResponsiveGameCovers
};

// Executa o exemplo se o arquivo for executado diretamente
if (require.main === module) {
    exampleUsage();
}