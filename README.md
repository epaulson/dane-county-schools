# Dane County Schools Attendance Areas

This is the source code for my Dane County schools attendance areas web application, which is available online at [https://epaulson.github.io/dane-county-schools/](https://epaulson.github.io/dane-county-schools/)

An important disclaimer: **the maps in this application are unofficial**, and even if they were official, school districts do not always follow attendance areas in order to balance class sizes between schools and for other reasons. **Always consult with your district when enrolling a student in that district.**
### Motivation
When I was on the Madison Common Council, one of the things I wondered was where did the students that live in my district attend school. This is a separate question than which schools are in my district. My district actually had schools from two separate school districts, because in Wisconsin since the 1980s school districts do not have to follow municipal boundaries.

It turns out that there was no single map of all school attendance areas, so I sat down to compile one. I was originally only going to do districts that intersected part of Madison, but it turned out that by the time I had collected all of those districts I was well on my way to having everything for Dane County, so I went ahead and tracked down the remaining districts. 

To make this data easier to use, I created this web application that lets you not only see the attendance areas, but you can filter the attendance areas by other political subdivisions. The app will create the intersection of the school attendance areas and that political subdivision.

The colored polygons on the map represent school attendance areas. You can choose between elementary, middle, and high schools. If you click on a polygon, you'll see a popup with the name of that school, any school-specific notes, and links to the school website, the WI Department of Public Instruction Directory Page for that school, and the page for that school at the federal National Center for Educational Statistics. 

The app lets you filter attendance areas by city council/aldermanic districts, county supervisor districts, municipalities, school districts, state assembly districts, and state senate districts. For state positions, because I only collected school information for districts that intersect Dane County, not all assembly and senate districts have all schools attendance areas, and I only set up state legislative districts for districts that are at least in part in Dane County. 

The app also displays the locations of schools, including some schools that do not have attendance areas like charter schools.

The URL contains all of the filter state, so you can share the URL with someone and they will see exactly what you are seeing.

The colors are mostly random but filled with a graph coloring algorithm to avoid having two neighboring attendance areas having the exact same color. I did make some effort to have some high schools use their school color but I did not do this for every high school, and did not do anything for the elementary or middle schools.

### Data Sources
The GeoJSON files are all in the geodata/ directory in this repository. For performance reasons, they are translated into [Geobuf](https://github.com/mapbox/geobuf) files when used in the application.

For political subdivisions, the state legislative districts, the municipalities, and the county supervisor districts are all from the Legislative Technical Services Bureau website at [https://gis-ltsb.hub.arcgis.com/pages/download-data](https://gis-ltsb.hub.arcgis.com/pages/download-data). I may replace the county supervisor districts with a map from the Dane County Land Information Office at [https://lio.danecounty.gov/](https://lio.danecounty.gov/)

The aldermanic districts are from a datafile created by [Greg Grube](https://grubeg.github.io/) of the Wisconsin Elections Commission in 2022, however, I replaced the Madison aldermanic boundaries with a more recent version from the [City of Madison Open Data Portal](https://data-cityofmadison.opendata.arcgis.com/) that reflects the final Town of Madison attachment, and edited them to cut out the Lakes Mendota and Monona from some districts.

The school districts, and the school locations, come from the [WI Department of Public Instruction's (DPI) Open Data Portal](https://dpi.wi.gov/wise/gis-maps/gis-open-data) managed by Shelley Witte. I also took the NCES IDs from the most excellent [School Directory Application](https://apps6.dpi.wi.gov/SchDirPublic/home) that the team at DPI created.

School data largely came from the DPI open data portal as well, because for many school districts there is only one elementary school, one middle school, and one high school for the entire district, so in that case I just copied the DPI data for the district into my map.

For other districts, I was able to find PDF files of their attendance areas and used QGIS to georeference the PDF map and overlay it on the DPI district boundaries, and trace out school attendance areas. 

For Sun Prairie, Louis Rada of the City of Sun Prairie was able to give me a shapefile of Sun Prairie school attendance areas. Michael LaCount of the Verona Area School District was able to give me a shapefile of Verona attendance areas. 

For Madison Metropolitan Schools, Eric Lequesne of MMSD's Research Assessment, and Improvement team has posted a shapefile of Madison schools at the [MMSD Website](https://www.madison.k12.wi.us/about/attendance-areas)

Special thanks to Superintendent Dr. Dennis Pauli and Kathy Pierce of Edgerton schools who were able to give me an ArcGIS webmap of Edgerton elementary schools, and to Dr. Leslie Bergstrom, Superindenent of Oregon Schools, who answered a few questions about attendance areas in Oregon schools.