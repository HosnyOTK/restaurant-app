# Script PowerShell pour ajouter le projet sur GitHub
# Exécutez ce script dans PowerShell : .\ajouter-sur-github.ps1

Write-Host "🚀 Initialisation de Git..." -ForegroundColor Green

# Vérifier si Git est installé
try {
    $gitVersion = git --version
    Write-Host "✅ Git installé : $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé. Téléchargez-le sur https://git-scm.com/downloads" -ForegroundColor Red
    exit 1
}

# Vérifier si déjà un dépôt Git
if (Test-Path .git) {
    Write-Host "⚠️  Un dépôt Git existe déjà." -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous continuer quand même ? (o/n)"
    if ($response -ne "o") {
        exit
    }
} else {
    # Initialiser Git
    Write-Host "📦 Initialisation du dépôt Git..." -ForegroundColor Cyan
    git init
}

# Ajouter tous les fichiers
Write-Host "📝 Ajout des fichiers..." -ForegroundColor Cyan
git add .

# Créer le premier commit
Write-Host "💾 Création du commit initial..." -ForegroundColor Cyan
git commit -m "Initial commit: Restaurant app avec React et Express"

Write-Host ""
Write-Host "✅ Dépôt Git initialisé avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "1. Allez sur https://github.com et créez un nouveau dépôt" -ForegroundColor White
Write-Host "2. Copiez l'URL de votre dépôt (ex: https://github.com/VOTRE_USERNAME/restaurant-app.git)" -ForegroundColor White
Write-Host "3. Exécutez ces commandes (remplacez l'URL par la vôtre) :" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/VOTRE_USERNAME/restaurant-app.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Consultez GUIDE_GITHUB.md pour les instructions détaillées" -ForegroundColor Yellow

