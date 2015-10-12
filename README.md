QUIQQER Tags (Themen)
========

Das Tag Packet erweitert QUIQQER um eine tag Verwaltung.

Tagging eine Technik, die es jedem Besucher erlaubt,
an die besuchten Seiten frei wählbare Begriffe zu hängen (die Texte werden quasi etikettiert).
Dadurch lassen sich Artikel in unterschiedliche Themenbereiche gleichzeitig einsortieren;
die starre Hierarchisierung der herkömmlichen Navigations-Rubriken wird somit ergänzt oder ersetzt.

Packetname:

    quiqqer/tags


Features
--------

- Tag Verwaltung
- Zuweisen einzelner Tags zu Seiten
- Tag-Suche
- Taglisten
- Tag Cache (Cron)


Installation
------------

Der Paketname ist: quiqqer/tags


Mitwirken
----------

- Issue Tracker: https://dev.quiqqer.com/quiqqer/package-tags/issues
- Source Code: https://dev.quiqqer.com/quiqqer/package-tags/tree/master


Support
-------

Falls Sie ein Fehler gefunden haben oder Verbesserungen wünschen,
Dann können Sie gerne an support@pcsg.de eine E-Mail schreiben.


License
-------

- GPL-2.0+


Entwickler
--------


Eine Seite besitzt folgende neue Attribute:

- (array) **quiqqer.tags.tagList**

```html
{$Site->getAttribute('quiqqer.tags.tagList')}
```

```html
{assign var=tags value=$Site->getAttribute('quiqqer.tags.tagList')}
{foreach from=$tags entry=tag}
    {$tag}
{/foreach}
```

## Controls die mitgeliefert werden

### {control control="\QUI\Tags\Controls\SiteTags" Site=$Site hideTitle=false}

Listet die Tags einer Seite auf

**Attribute**
+ {\QUI\Projects\Project\Site} Site - Seite für die die Tags angezeigt werden soll
+ {Bool} hideTitle - [optional] zeigt den Titel vor den Tags an oder nicht an


### {control control="\QUI\Tags\Controls\TagList" Site=$Site Project=$Project}

Zeigt eine Tag Liste an. Tags anzeigen von A-Z

**Attribute**
+ {\QUI\Projects\Project\Site} Site - [optional] Die Liste selbst, wenn keine Liste angegeben wird, wird eine Seite types:tag-listing gesucht
+ {\QUI\Projects\Project} Project - [optional] Project der Liste, wenn kein Projekt angegeben wird, wird das Projekt der Site verwendet
