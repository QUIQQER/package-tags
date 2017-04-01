QUIQQER Tags (Themen)
========

Das Tag-Paket erweitert QUIQQER um eine Tag-Verwaltung.

Tagging ist eine Technik, die es jedem Besucher erlaubt, an die besuchten Seiten 
frei wählbare Begriffe zu hängen (die Texte werden quasi etikettiert).
Dadurch lassen sich Artikel in unterschiedliche Themenbereiche gleichzeitig einsortieren;
die starre Hierarchisierung der herkömmlichen Navigations-Rubriken wird somit ergänzt oder ersetzt.

Paketname:

    quiqqer/tags


Features
--------

- Tag-Verwaltung
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

Falls Sie Fehler gefunden, Wünsche oder Verbesserungsvorschläge haben, 
können Sie uns gern per Mail an support@pcsg.de darüber informieren.  
Wir werden versuchen auf Ihre Wünsche einzugehen bzw. diese an die 
zuständigen Entwickler des Projektes weiterleiten.


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
+ {Bool} hideTitle - [optional]  Einstellung, um den Titel vor den Tags anzuzeigen oder auszublenden.


### {control control="\QUI\Tags\Controls\TagList" Site=$Site Project=$Project}

Zeigt eine Tagliste an. Tags anzeigen von A-Z

**Attribute**
+ {\QUI\Projects\Project\Site} Site - [optional] Die Liste selbst, wenn keine Liste angegeben wird, wird eine Seite types:tag-listing gesucht
+ {\QUI\Projects\Project} Project - [optional] Projekt der Liste, wenn kein Projekt angegeben wird, wird das Projekt der Site verwendet
