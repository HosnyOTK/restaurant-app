# Guide : Ajouter une vidéo en arrière-plan

## 📹 Instructions pour ajouter une vidéo en arrière-plan à la page d'accueil

### Étape 1 : Préparer votre vidéo

1. **Format recommandé** : MP4 (H.264)
2. **Taille** : Optimisez votre vidéo (idéalement < 20MB pour de meilleures performances)
3. **Dimensions** : 1920x1080 ou similaire (16:9)
4. **Durée** : Court (10-30 secondes en boucle)
5. **Sans son** : La vidéo doit être muette

### Étape 2 : Placer la vidéo dans le projet

Créez un dossier `public/videos/` dans votre projet et placez-y votre vidéo :

```
frontend/
├── public/
│   ├── videos/
│   │   └── background.mp4  ← Votre vidéo ici
│   └── ...
```

### Étape 3 : Activer la vidéo dans le code

Ouvrez le fichier `frontend/src/components/Accueil.js` et décommentez les lignes 30-36 :

```jsx
return (
  <div className="accueil-container">
    {/* Décommentez ces lignes : */}
    <div className="video-background">
      <video autoPlay muted loop playsInline>
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>
    </div>
    
    <div className="container">
      {/* ... reste du code ... */}
    </div>
  </div>
);
```

### Étape 4 : Personnaliser l'opacité (optionnel)

Pour ajuster l'opacité de la vidéo, modifiez dans `frontend/src/App.css` :

```css
.video-background video {
  opacity: 0.3; /* Changez cette valeur (0.1 à 1.0) */
}

.video-background::after {
  background: rgba(255, 255, 255, 0.7); /* Changez l'opacité ici aussi */
}
```

### Étape 5 : Alternative avec image de fallback

Si vous voulez une image de fond en cas d'erreur vidéo :

```jsx
<div className="video-background">
  <video autoPlay muted loop playsInline>
    <source src="/videos/background.mp4" type="video/mp4" />
    <img src="/images/background-fallback.jpg" alt="Background" />
  </video>
</div>
```

### 🎨 Conseils de design

1. **Vidéo subtile** : Utilisez des vidéos avec des mouvements lents et doux
2. **Contraste** : Assurez-vous que le texte reste lisible par-dessus
3. **Performance** : Optimisez la vidéo pour le web (utilisez HandBrake ou similar)
4. **Mobile** : La vidéo peut être désactivée sur mobile si nécessaire (voir CSS responsive)

### 📱 Désactiver la vidéo sur mobile (optionnel)

Ajoutez dans `App.css` :

```css
@media (max-width: 768px) {
  .video-background {
    display: none;
  }
  
  .accueil-container {
    background: url('/images/background-mobile.jpg') center/cover;
  }
}
```

### ✅ Résultat attendu

Une fois activée, la vidéo :
- Se lance automatiquement en boucle
- Reste en arrière-plan avec opacité réduite
- Permet au texte de rester lisible
- S'adapte à toutes les tailles d'écran

---

**Note** : Si vous utilisez une vidéo très lourde, considérez l'héberger sur un CDN ou utiliser une image animée (GIF) à la place.









