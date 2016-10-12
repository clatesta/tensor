# TODO

1. de presentatie zou mee een mapping moeten zijn op users
- hoeveel streams/kijkers kan ik op 1 origin
- om daaruit de sizing af te kunnen leiden: hoeveel origins van type x heb ik nodig voor n gebruikers (total nr of viewers / max viewers per origin = nr of origins)

2. cut of point
- op welk moment zit een origin aan zn max, kan niet goed meer antwooorden en players beginnen te downscalen

3. gebruik capture met selectie van de hoogste bitrate (niet alles tegelijk)

4. test een CDN.

5. **Done** video preview window, als dat gaat stotteren bij een test is dat ook indicatief

6. **WIP** live ingest test, hoeveel channels van bitrate x origin y kan ingest (HTTP POST ipv GET)

7. **Semi-Done** aardig inzicht, het volgende zou ook zichtbaar moeten zijn:

- max nr highest = x nr of possible streams out
- half max bitrate = 2x nr of possible streams out
- fourth max bitrate = 4x nr of possible streams out

8. **Done** reporting: download all data as csv and upload csv to create the view

9. we need to define which tests (will get back to you about this, or write them down in the docs)

10. user interface, we shd have a think on (final) looks)

11. **Done** installer

12. run on actual hardware (we cd try the installer for that

13. change unit test to test server x per build

14. improve baseline (50MB download, netperf - these are not quite the thing)

15. **Done** Save number of connections per datapoint.

16. **Done** Make data scrollable (This is a big one.)

17. **Done** Button to save all graphs.