# DWM Project

## Doel

DWM volgt de warmtetransitie met nadruk op wat bestuurlijk, technisch en uitvoerend relevant is. Vanaf nu hoort daar expliciet ook het sociale domein bij: de kant van verduurzaming die bewoners, huurders, woningcorporaties, particuliere woningeigenaren en wijkgemeenschappen direct raakt.

## Nieuwe redactionele categorie

`Sociaal domein & bewoners`

Deze categorie is bedoeld voor artikelen waarin de menselijke impact centraal staat. Het gaat dus niet alleen om techniek of beleid, maar om de vraag wat de overstap naar verduurzaming in de praktijk betekent voor mensen in huis, in de wijk en in het dagelijks gebruik.

### Dit valt er wel onder

- woningcorporaties, huurdersorganisaties en sociale huur
- particuliere woningeigenaren en VvE's
- woonlasten, betaalbaarheid, investeringsdrempels en keuzevrijheid
- bewonerservaringen met warmtenetten, warmtepompen, isolatie en aardgasvrij wonen
- comfort, geluid, gebruiksgemak, planning achter de voordeur en nazorg
- draagvlak, participatie, instemming, vertrouwen en emoties rond de overstap
- bewonersinitiatieven, energiecoaches en lokale praktijkverhalen

### Dit valt er niet automatisch onder

- zuiver technische product- of systeemupdates zonder bewonersimpact
- beleidsberichten zonder duidelijke gevolgen voor huurders, bewoners of gebruikers
- projectnieuws waarin sociale impact slechts zijdelings wordt genoemd

## Redactionele toepassing

- Streef per editie naar minimaal 1 en bij voorkeur 1-3 artikelen in deze categorie of met de pijler `sociaal-domein`.
- Gebruik de categorie `Sociaal domein & bewoners` als bewonersimpact de hoofdinvalshoek is.
- Houd de bestaande hoofdcategorie aan en voeg de pijler `sociaal-domein` toe als het sociale aspect ondersteunend maar wel wezenlijk is.
- Benoem altijd concreet wat bewoners merken: kosten, comfort, regeldruk, vertrouwen, tempo, begrip of uitvoerbaarheid.
- Houd de stijl beknopt en concluderend; verrijk alleen met achtergrond die echt helpt en voorkom vulling.
- Maak artikelen doorgaans niet langer dan ongeveer 2x de bronlengte.
- Leg in `verwerking` altijd vast welk model is gebruikt. Standaardvoorkeur: lokaal via Ollama, tenzij expliciet anders gekozen.

## Wekelijkse run

- Neem het sociale domein standaard mee in iedere wekelijkse run.
- Scan daarvoor niet alleen `NPLW` en `RVO`, maar ook standaard `Aedes`, `Woonbond`, `Vereniging Eigen Huis`, `Milieu Centraal`, `Platform31` en `TNO`.
- Publiceer per editie minimaal 1 nieuw artikel waarvan bewoners, huurders, woningcorporaties of gebruikerservaring de hoofdinvalshoek zijn.
- Hanteer als streefwaarde 1-3 nieuwe sociaal-domeinartikelen per editie als de bronweek dat toelaat.
- Voeg de pijler `sociaal-domein` ook toe aan artikelen in andere categorieën zodra bewonersimpact duidelijk een wezenlijk onderdeel van het verhaal is.
- Neem altijd de directe bronlink op en gebruik de bronafbeelding als die beschikbaar is.
- Als er in een week geen sterk zelfstandig sociaal-domeinartikel beschikbaar is, benoem dat expliciet in de verwerking en label ten minste één relevant artikel met `sociaal-domein`.

## Aanvullende bronnen

De bestaande kernbronnen `NPLW` en `RVO` blijven leidend. Voor het sociale domein voegen we daar structureel deze bronfamilies aan toe:

- `Aedes` — [https://aedes.nl](https://aedes.nl)  
  Focus: woningcorporaties, huurders, woonlasten, uitvoerbaarheid en corporatiepraktijk.
- `Woonbond` — [https://www.woonbond.nl](https://www.woonbond.nl)  
  Focus: huurdersperspectief, instemming, betaalbaarheid, rechten en draagvlak.
- `Vereniging Eigen Huis` — [https://www.eigenhuis.nl](https://www.eigenhuis.nl)  
  Focus: particuliere woningeigenaren, kostenafwegingen, keuzevrijheid en vertrouwen.
- `Milieu Centraal` — [https://www.milieucentraal.nl](https://www.milieucentraal.nl)  
  Focus: praktische bewonersuitleg over warmtenetten, isolatie, warmtepompen en gedragskant.
- `Platform31` — [https://www.platform31.nl](https://www.platform31.nl)  
  Focus: bewonersinitiatieven, participatie, wijkaanpak, energiearmoede en sociaal proces.
- `TNO` — [https://www.tno.nl](https://www.tno.nl)  
  Focus: onderzoek naar woonlasten, sociale huur, adoptiegedrag en de feitelijke gebruikersimpact van verduurzaming.

## Handmatige brontypen

Naast de wekelijkse webscrape zijn twee typen bronnen structureel relevant maar niet automatisch beschikbaar. Ze worden handmatig toegevoegd wanneer beschikbaar.

Kamerbrieven en Tweede Kamerstukken (Ministerie van Klimaat en Groene Groei, EZK, BZK): bevatten beleidsvoortgang, actieplannen en voortgangsrapportages die de energietransitie direct raken. Zijn gezaghebbend en tijdloos bruikbaar ook als ze ouder zijn. Te vinden via rijksoverheid.nl/documenten/kamerstukken of zoek.officielebekendmakingen.nl. Scan wekelijks of er relevante nieuwe stukken zijn gepubliceerd.

Sector- en onderzoeksrapporten (TKI Urban Energy, WeLabs, CE Delft, TNO, PBL, RLI, Energeia): bevatten diepgaande analyse van systeem- en marktdynamiek die nieuwsberichten niet bieden. Relevant als ze de structurele uitdagingen van de transitie beschrijven of beleids- en technologiekeuzes onderbouwen. Worden handmatig aangeleverd vanuit `data/Handmatige artikelen/` of door de redacteur gesignaleerd.

Beide typen worden opgenomen in `bronindex.json` met `type: "kamerbrief"` of `type: "rapport"` en een `referentie`-veld. URL mag leeg zijn bij handmatig aangeleverde documenten.

## Classificatieregel

Gebruik `Sociaal domein & bewoners` zodra minstens een van deze vragen centraal staat:

1. Wat merken bewoners of huurders hier concreet van?
2. Verandert dit iets aan comfort, lasten, keuzevrijheid of vertrouwen?
3. Gaat dit primair over corporaties, particuliere huishoudens of bewonersparticipatie?

Als het antwoord vooral technisch, bestuurlijk of infrastructureel is, blijft de bestaande categorie leidend en krijgt het artikel hooguit de pijler `sociaal-domein`.
