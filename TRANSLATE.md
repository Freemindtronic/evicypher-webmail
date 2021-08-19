_This page is available in French only for now._

# Traduire l'extension EviCypher Webmail

On appelle _internationalization_ (abrégé _i18n_) le fait de développer une application compatible avec différentes langues et régions. Le processus comprend la traduction de l'interface graphique, mais aussi l'utilisation de la monaie locale, du format usuel de dates et d'adresses, etc.

L'extension EviCypher webmail a été conçue avec ces contraintes en tête, ce qui permet l'ajout d'une langue ou d'une région sans modification _majeure_ du code.

## Pour les traducteurs

EviCypher Webmail utilise un format conventionnel pour ses fichiers de traduction : du JSON clé-valeur. Les clés sont des identifiants uniques écrits en _kebab-case_, et les valeurs sont les traductions affichées. Il existes de [nombreux logiciels](https://alternativeto.net/software/po-editor/) pour éditer ces fichiers avec une interface graphique, la suite de cette documentation est illustrée avec des captures de l'un de ces logiciels : [POEditor](https://poeditor.com/). En version gratuire, POEditor accepte de charger 1 000 traductions, ce qui est suffisant pour nos besoins pour l'instant. [Tarifs de POEditor.](https://github.com/marketplace/poeditor/)

### Créer un projet POEditor

Se connecter à POEditor avec un compte GitHub et créer un nouveau projet, nommé par exemple `evicypher-webmail`.

![image](https://user-images.githubusercontent.com/48261497/130031880-ec063587-ccf2-4170-b899-ec794ac212b7.png)

Ajouter les langues dans lequelles ont veut que l'extension soit disponible. Pour l'instant les langues crées sont vides, aucune clé n'est chargée.

![image](https://user-images.githubusercontent.com/48261497/130032055-595789aa-5508-4cac-aafa-3d142489054e.png)

Définir l'anglais comme langue par défaut.

Charger les traductions existantes depuis GitHub. Cette option se trouve dans [Home / Account / Integrations / GitHub Integration](https://poeditor.com/github/projects).

![image](https://user-images.githubusercontent.com/48261497/130032962-00f4c5ed-9b98-4bce-8571-f1ed3986ab1d.png)

![image](https://user-images.githubusercontent.com/48261497/130033043-3ff75003-1acf-4daa-bd55-5d3ca0d68902.png)

On remarque que POEditor détecte automatique le format des fichiers de traduction.

**POEditor fonctionne en important d'abord les clés puis les valeurs.**

Une fois toutes les langues ajoutées et reliées à un fichier du dépôt, il faut importer les clés. Pour chaque fichier chargé, cliquer sur _Get terms_.

![image](https://user-images.githubusercontent.com/48261497/130033789-93038a2a-b051-4e29-8640-dc13311adcff.png)

Une fois les clés chargées, il faut importer les traductions existantes. (Cocher _overwrite existing translations_, les fichiers du dépôt font foi.)

![image](https://user-images.githubusercontent.com/48261497/130033353-d1a6c9c0-5b91-4469-8772-07be873d1cc6.png)

Une fois les traductions chargées, POEditor affiche l'avancement de la traduction.

![image](https://user-images.githubusercontent.com/48261497/130034605-723c2a3c-7042-4063-87f1-1e477340b77b.png)

Définir l'anglais (ou le français) en langue par défaut dans les options du projet.

![image](https://user-images.githubusercontent.com/48261497/130034427-c985ac3f-293c-495d-a20a-3409e71b95a3.png)

Revenir à l'accueil du projet.

### Traduire

**Toujours commencer une session de traduction par importer les clés puis les valeurs** (étapes _Get terms_ et _Import translations from GitHub_ détaillées au dessus), pour mettre à jour la base de données de POEditor. Ce sont les fichiers du dépôt qui font foi, et ils peuvent être édités par d'autres outils.

L'interface de traduction s'affiche en cliquant sur une langue.

![image](https://user-images.githubusercontent.com/48261497/130035006-47eb7e4b-e341-4392-b917-f0b4b2e9115d.png)

À gauche se trouvent la traduction de référence et la clé qui identifie cette traduction, à droite, la traduction à écrire dans la langue choisie.

### Mettre à jour les fichiers du dépôt

**La traduction n'est pas effective tant que les fichiers du dépôts ne sont pas mis à jour.**

Sur la même page que pour importer les traductions de GitHub, il est possible d'y exporter les traductions mises à jours. Sélectionnés les langues éditées, et cliquer sur _Go_.

![image](https://user-images.githubusercontent.com/48261497/130036052-2b454c8e-304c-4bf5-9078-3b02422f0402.png)

POEditor va créer un commit par fichier à mettre à jour, et les traductions seront disponibles à tous les utilisateurs dès la prochaine mise à jour.

## Pour les développeurs

L'extension VSCode [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) est déjà configurée pour le dépôt. Elle permet :

- De modifier les traductions existantes avec une interface graphique
- D'ajouter une nouvelle clé avec la traduction associée
- De supprimer les clés inutilisées

### Modifier les traductions existantes

Au survol d'une clé, les traductions faites et à faire s'affichent. Cliquer sur 💬 pour afficher l'interface graphique de traduction.

![image](https://user-images.githubusercontent.com/48261497/130036708-645faf7e-ec1a-4250-ae90-9db16cb5f04c.png)

### Ajouter une clé

Sélectionner du texte dans un fichier Svelte et cliquer sur 💡, puis 🌍 _Extract text into i18n messages_.

![image](https://user-images.githubusercontent.com/48261497/130037280-9a2ecb92-cdf2-48fb-a402-f0d45aa3f073.png)

L'extension propose une nouvelle clé générée automatiquement, puis le code à insérer à la place (choisir `{$_('...')}` pour Svelte). Par convention, les clés sont en anglais. Pour que la génération automatique marche directement, il est recommandé d'écrire le texte à extraire en anglais.

### Supprimer les clés inutilisées

L'onglet de l'extension offre de nombreuses fonctionnalités, dont la possiblité de supprimer les clés qui n'apparaissent pas dans le code.

![image](https://user-images.githubusercontent.com/48261497/130038087-eceafc2e-a0fe-41fe-bca1-2ee04612ca4c.png)
