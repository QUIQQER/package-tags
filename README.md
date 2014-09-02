# QUIQQER Tag Package

_German_

Das Tag Packet erweitert QUIQQER um eine tag Verwaltung.

Tagging eine Technik, die es jedem Besucher erlaubt,
an die besuchten Seiten frei wählbare Begriffe zu hängen (die Texte werden quasi etikettiert).
Dadurch lassen sich Artikel in unterschiedliche Themenbereiche gleichzeitig einsortieren;
die starre Hierarchisierung der herkömmlichen Navigations-Rubriken wird somit ergänzt oder ersetzt.


# Installation

```json
{
    "repositories": [
        {
            "type": "composer",
            "url": "http://update.quiqqer.com/"
        }
    ]
}

```
Package Name:

+ quiqqer/tags


## Installation dev

```json
{
    "type": "vcs",
    "url": "git@dev.quiqqer.com:quiqqer/package-tags.git"
}
```

```bash
php var/composer/composer.phar --working-dir="var/composer/" require "quiqqer/tags:dev-master"
```
