# GeoJSON Property Schemas

## dane_county.geojson
This file has the boundary for Dane County. It only has one feature and was extracted from a larger file.
- `COUNTY_FIP` - The FIPS code for Dane County
- `COUNTY_NAM` - "Dane" since this file only feature
- `DNR_CNTY_C`
- `DNR_REGION`
- `OBJECTID`
- `SHAPEAREA`
- `SHAPELEN`

## dane_county_alder_dists.geojson
This file has all of the aldermanic districts in Dane County, which is some but not all of the municipalities in Dane County. (Only cities have alders. Towns and villages have supervisors and trustees, but they're elected at-large and there are no districts.) It was extracted from a larger file to only include Dane County 
- `ALDERID` - This is an ascii string but is the ID of the district. It often has a leading zero.
- `CNTY_FIPS` - the FIPS code for the county. This file will only have Dane County data so it's always the same.
- `CNTY_NAME` - County name. Always "Dane"
- `COUSUBFP` - the FIPS code for the municipality 
- `FID` - the Feature ID from the original file. Not meaningful. 
- `Label` - the longer name of the municipality, e.g. "City of Fitchburg"
- `MuniName` - the name of the municipality e.g. 'Fitchburg'
- `MuniType` - the type of municipality. Always 'City' since only cities have alders in this file
- `Shape__Area` - the area, but not reliable in this file
- `Shape__Length` - the shape, again not reliable in this file.

## dane_county_assembly_dists.geojson
This geojson file has all of the geometries of the the Wisconsin state assembly that are in at least part of Dane County. It is extracted from a larger file that had all state assembly districts.
- `ASM2024` - The number of the assembly district, but as an ascii string.
- `FID` - the feature ID from the original file. It actually is the integer version of 'ASM2024'
- `SEN2024` - The ascii version of the senate district this assembly district is contained in.

## dane_county_munis.geojson
This file is the geometry of all municipalities that are at least in part in Dane County. It is extracted from a larger file of all municipalities in Wisconsin. In the original dataset municipalities that are in multiple counties are split into different features so everything is contained in one county, e.g. Edgerton is split into two features, one in Dane County and one in Rock County. The extracted file only contains the Dane County portions.
- `CNTY_FIPS` - the Federal FIPS code for Dane County.
- `CNTY_NAME` - always "Dane"
- `CONTACT` - the person responsible for the data.
- `COUSUBFP` - the FIPS code for the municipality
- `CTV` - "City", 'Town', or 'Village' - one ASCII character of 'C', 'T', or 'V'
- `DATE_SUB` - Date submitted?
- `DOA` - a code for the WI Dept of Administration
- `DOR` - a code for the WI Dept of Revenue
- `DOT` - a code for the WI Dept of Transportation
- `FIPS5` - More old FIPS codes
- `FIPS6` - more old FIPS codes
- `GEOID` - the ID of this feature in the original dataset
- `LABEL` - a string for the name of the municipality - might be 'MONONA - C' for the city of monona
- `MCD_FIPS` - the FIPS code for the Minor Civil Division - combines the CNTY_FIPS with COSUBFP
- `MCD_NAME` - the name of the municipality, no other info, e.g. 'Monona' - will be the same for places that have both a town and a city.

## dane_county_public_schools.geojson
This file is a point geojson with the location of each individual school for the different attendance area files, which are polygons. 
- `AGENCYTYPE` - Public School or something else, like a non-district charter school
- `CESA` - the CESA (Cooperative Educational Service Agency) district that serves this school. It's an integer
- `CHARTER` - a "Yes" or "No" ascii string if this is a charter school
- `CITY` - the postal city for this school
- `CONGRESS` - an integer, the congressional district. Always 2 in this file
- `COUNTY` - The County, always "Dane"
- `CTY_DIST` - this is always also "Dane"
- `DISTRICT` - the school district name
- `FULL_ADDR` - the address of the school
- `GRADE_RANG` - the grade range. Not always reliable.
- `HIGH_GRADE` - the highest grade in the school.
- `LAT` - the latitude for the school. There's a separate geometry in the geojson, this isn't really needed
- `LOCALE` - the Location type, might be 'City -Large' or 'Suburb - Large' or 'Rural - Distant'
- `LOCALE_COD` - the location code, an integer.
- `LON` - the longitude. not really needed because it's available in the point of the geometry. 
- `LOW_GRADE` - the lowest grade
- `NCES_CODE` - the National Center for Educational Statistics (NCES) ID for this school.
- `NCES_DIST` - the NCES ID for this district
- `NCES_SCH` - the NCES sub-id for this school inside the district. Prefer the longer NCES_CODE for the school
- `PHYS_ADDR` - yet another address
- `SCHOOL` - the name of the school.
- `SCHOOLTYPE` - the type, 'Elementary School', 'Middle School', 'High School'
- `SCHOOL_URL` - the website for the school
- `SCH_CODE` - the Wisconsin Department of Public Instruction (DPI) code for this school inside the district. Ascii string
- `SCH_STYLE` - the format of school, e.g. 'Regular', 'Alternative', 'Vocational Education'
- `SDID` - the DPI ID for the school district. Ascii string.
- `STATE` - always "WI"
- `UNIQUE_` - a Unique DPI ID for the school, combined "S" + SDID + SCH_CODE
- `VIRTUAL` - is the school virtual or not, a "Yes" or "No"
- `WI_ASSEMB` - integer for the assembly district this school is in
- `WI_SENATE` - integer for the senate district this school is in
- `ZIP_CODE` - ascii string of zip code

## dane_county_school_districts.geojson
This file contains the geometry of entire school districts. The elementary, middle, and high school attendance area files were originally derived from this file by splitting the geometry of the district into smaller chunks for each individual school.
- `District` - The school district name
- `NotesElem` - a string for notes that apply to all elementary schools for this district
- `NotesHigh` - a string for notes that apply to all high schools for this district
- `NotesMid` - a string for notes that apply to all middle schools for this district
- `SDID` - the DPI SDID for this school district. An ASCII string.
- `id` - an ID for use in this file, not meaningful outside of this file.

## dane_county_senate_districts.geojson
A file with the geometry of Wisconsin Senate districts that are at least in part in Dane County. Derived from a file that had all districts in the state.
- `FID` - the Feature ID of this district. An integer version of the senate district
- `SEN2024` - the senate district, as an ascii string

## dane_county_supervisors.geojson
 This file has the geometry of the County Board of Supervisor districts for Dane County. Each feature has these attributes. It was extracted from a statewide file that had all county supervisory districts from all counties of the state.
- `CNTY_FIPS` - The federal FIPS for Dane County.
- `CNTY_NAME` - always "Dane"
- `CONTACT` - the person who uploaded this data to the state to collect
- `DATE_SUB` - the date this data was uploaded to the state
- `GEOID` - not useful, an ascii string of the CNTY_FIPS plus the district ID
- `LABEL` - the 
- `OBJECTID` - the ID of this feature in the original file, not useful outside of that file
- `SUPERID` - an ascii string of the supervisory district, e.g. "01" or "11"
- `SUPER_FIPS` - a duplicate of GEOID?

## dane_elementaries_colored.geojson
The attendance areas of elementary schools for all school districts that are at least partially in Dane County. Some of these polygons might fall all or partially outside of Dane County, because we only require that part of the district is in Dane County. It was made by stitching together attendance area files from different school districts, but is often just copied out of the DPI school district data, especially for districts that might only have one school for the entire district. This file has a color assigned to each school that was precomputed using a graph coloring algorithm to avoid having neighboring schools using the same color on a map.
- `dist_wide` - an ascii string of "TRUE" or "FALSE" if this school encompasses the entire district, which is common for some smaller districts
- `district` - the name of the school district
- `dpi_dis_id` - the DPI School district ID, usually SDID in other files. Ascii string
- `dpi_sch_id` - the DPI School ID for this school, sometimes "SCH_CODE" in other files. We can combined the dpi_dis_id and dpi_sch_id to use a key for the DPI school directory website
- `extra_id` - an ID we can use for things that aren't formally schools, like the "Allied Option Zone" which is a geometry that can be used places where students have their choice of which school to attend. 
- `former_name` - if the school has recently changed its name, this is an ascii string of what it used to be called
- `grades_svd` - an ascii string of which grades are served, e.g. "6-8" or "4K-5"
- `id` - an integer ID for this feature in the file, not meaningful outside of the file
- `mapcolor` - the hex code of the color to use for this school on a map
- `nces_id` - an ascii string of the NCES ID for this school. Non-school things won't have this, but will have an 'extra_id' in that case. For features that do have an nces ID we can use it to create a link to the NCES school database website
- `notes` - an ascii string with notes that are specific to this school or non-school thing, like "Students at this school attend 4th and 5th grade at this school" or "Students in this attendance option area can choose between Crestwood or Stephens school"
- `sch_type` - the type of the school, e.g. "Elementary" or "Middle". May not be present on non-school geographies like option attendance area. Best not to use
- `schoolname` - the name of the school
- `website` - the website of the school

## dane_highschools_colored.geojson
The attendance areas of high schools for all school districts that are at least partially in Dane County. Some of these polygons might fall all or partially outside of Dane County, because we only require that part of the district is in Dane County. It was made by stitching together attendance area files from different school districts, but is often just copied out of the DPI school district data, especially for districts that might only have one school for the entire district. This file has a color assigned to each school that was precomputed using a graph coloring algorithm to avoid having neighboring schools using the same color on a map.
- `dist_wide` - an ascii string of "TRUE" or "FALSE" if this school encompasses the entire district, which is common for some smaller districts
- `district` - the name of the school district
- `dpi_dis_id` - the DPI School district ID, usually SDID in other files. Ascii string
- `dpi_sch_id` - the DPI School ID for this school, sometimes "SCH_CODE" in other files. We can combined the dpi_dis_id and dpi_sch_id to use a key for the DPI school directory website
- `extra_id` - an ID we can use for things that aren't formally schools, like the "Allied Option Zone" which is a geometry that can be used places where students have their choice of which school to attend. 
- `former_name` - if the school has recently changed its name, this is an ascii string of what it used to be called
- `grades_svd` - an ascii string of which grades are served, e.g. "6-8" or "4K-5"
- `id` - an integer ID for this feature in the file, not meaningful outside of the file
- `mapcolor` - the hex code of the color to use for this school on a map
- `nces_id` - an ascii string of the NCES ID for this school. Non-school things won't have this, but will have an 'extra_id' in that case. For features that do have an nces ID we can use it to create a link to the NCES school database website
- `notes` - an ascii string with notes that are specific to this school or non-school thing, like "Students at this school attend 4th and 5th grade at this school" or "Students in this attendance option area can choose between Crestwood or Stephens school"
- `sch_type` - the type of the school, e.g. "Elementary" or "Middle". May not be present on non-school geographies like option attendance area. Best not to use
- `schoolname` - the name of the school
- `website` - the website of the school

## dane_middleschools_colored.geojson

The attendance areas of middle schools for all school districts that are at least partially in Dane County. Some of these polygons might fall all or partially outside of Dane County, because we only require that part of the district is in Dane County. It was made by stitching together attendance area files from different school districts, but is often just copied out of the DPI school district data, especially for districts that might only have one school for the entire district. This file has a color assigned to each school that was precomputed using a graph coloring algorithm to avoid having neighboring schools using the same color on a map.
- `dist_wide` - an ascii string of "TRUE" or "FALSE" if this school encompasses the entire district, which is common for some smaller districts
- `district` - the name of the school district
- `dpi_dis_id` - the DPI School district ID, usually SDID in other files. Ascii string
- `dpi_sch_id` - the DPI School ID for this school, sometimes "SCH_CODE" in other files. We can combined the dpi_dis_id and dpi_sch_id to use a key for the DPI school directory website
- `extra_id` - an ID we can use for things that aren't formally schools, like the "Allied Option Zone" which is a geometry that can be used places where students have their choice of which school to attend. 
- `former_name` - if the school has recently changed its name, this is an ascii string of what it used to be called
- `grades_svd` - an ascii string of which grades are served, e.g. "6-8" or "4K-5"
- `id` - an integer ID for this feature in the file, not meaningful outside of the file
- `mapcolor` - the hex code of the color to use for this school on a map
- `nces_id` - an ascii string of the NCES ID for this school. Non-school things won't have this, but will have an 'extra_id' in that case. For features that do have an nces ID we can use it to create a link to the NCES school database website
- `notes` - an ascii string with notes that are specific to this school or non-school thing, like "Students at this school attend 4th and 5th grade at this school" or "Students in this attendance option area can choose between Crestwood or Stephens school"
- `sch_type` - the type of the school, e.g. "Elementary" or "Middle". May not be present on non-school geographies like option attendance area. Best not to use
- `schoolname` - the name of the school
- `website` - the website of the school
