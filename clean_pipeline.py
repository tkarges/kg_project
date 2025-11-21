import json
import pandas as pd
import numpy as np
import re

def clean_main():
    base_path = 'data/preprocessed/'

    json_file_path_mmds_master = base_path + 'mmds.json'
    json_file_path_wifo_bachelor = base_path + 'wifo_bachelor.json'
    json_file_path_wifo_master = base_path + 'wifo_master.json'
    json_file_path_wima_bachelor = base_path + 'wima_bachelor.json'
    json_file_path_wima_master = base_path + 'wima_master.json'
# json_file_path = 'mk_wifo_master.txt'

    jsons = [json_file_path_mmds_master, json_file_path_wifo_bachelor, json_file_path_wifo_master, json_file_path_wima_bachelor, json_file_path_wima_master]
    data = []
# Read the JSON file
    for path in jsons:
        with open(path, 'r', encoding='utf-8') as f:
            data.append(json.load(f))
            


# Create a pandas DataFrame from the JSON data
    df_mmds = pd.DataFrame(data[0])
    df_wifo_bachelor = pd.DataFrame(data[1])
    df_wifo_master = pd.DataFrame(data[2])
    df_wima_bachelor = pd.DataFrame(data[3])
    df_wima_master = pd.DataFrame(data[4])

    dfs = [df_mmds, df_wifo_bachelor, df_wifo_master, df_wima_bachelor, df_wima_master]

# Concatenate all dataframes into a single df_modules
    

    for i, df in enumerate(dfs):
        #df['moduleno'] = df['moduleno'].astype(str)
        #df['moduleno'] = df['moduleno'].apply(remove_whitespaces)
        #df['lecturer'] = df['lecturer'].apply(remove_whitespaces)
        #df['range_of_application'] = df['range_of_application'].apply(remove_whitespaces)
        
        df['type_of_module'] = df['type_of_module'].apply(clean_type_of_module)
        df['form_of_module'] = df['form_of_module'].apply(clean_form_of_module)
        df['level'] = df['level'].apply(clean_level)
        df['form_of_assessment'] = df['form_of_assessment'].apply(clean_form_of_assessment)
        df['admission_requirements_for_assessment'] = df['admission_requirements_for_assessment'].apply(clean_admission_requirements)
        df['duration_of_assessment'] = df['duration_of_assessment'].apply(clean_duration_of_assessment)
        df['language'] = df['language'].apply(clean_language)
        df['offering'] = df['offering'].apply(clean_offering)
        df = clean_further(df)
        df['range_of_application'] = df['range_of_application'].apply(standardize_range_of_application)
        df['semester'] = df['semester'].apply(clean_semester)
        for col in df.columns:
            df[col] = df[col].apply(process_string)

        df = df.rename(
            columns={
                "moduleno": "module_id",
                "name": "module_name",
                "type_of_module": "type",
                "form_of_assessment": "assessment_form",
                "admission_requirements_for_assessment": "admission_requirements",
                "semester": "recommended_semester",
                "aim_of_module": "aim",
                "duration_of_assessment": "assessment_duration" ,
                "range_of_application": "application_range"
            }
        )

        dfs[i] = df

    #df_modules = pd.concat(dfs, ignore_index=True)
    return dfs

def process_string(title):
    return str(title).replace(' ', '[WS]').replace('\n', '').replace('-', '')

def clean_form_of_module(text):
    text_lower = str(text).lower()
    found_terms = []

    # Check for keywords and add them to the list if found
    if 'lecture' in text_lower or 'vorlesung' in text_lower:
        found_terms.append('Lecture')
    if 'inverted classroom' in text_lower:
        found_terms.append('Inverted classroom')
    if 'exercise' in text_lower or 'übung' in text_lower:
        found_terms.append('Exercise')
    if 'tutorial' in text_lower or 'tutor' in text_lower:
        found_terms.append('Tutorial')
    if 'project' in text_lower or 'projekt' in text_lower:
        found_terms.append('Project')

    # Remove duplicates while preserving order
    seen = set()
    unique_found_terms = []
    for item in found_terms:
        if item not in seen:
            seen.add(item)
            unique_found_terms.append(item)

    if unique_found_terms:
        return '; '.join(unique_found_terms)
    else:
        # If no keywords are found, return the original text (lowercased) as a fallback
        return text_lower
    

def clean_type_of_module(text):
    text_lower = str(text).lower()
    if 'specialization course' in text_lower or 'specialization' in text_lower:
        return 'Specialization Course'
    elif 'computer science' in text_lower and 'fundamental' in text_lower:
        return 'Computer Science Fundamental'

    return text

def clean_level(text):
    text_lower = str(text).lower()
    found_terms = set()
    if 'bachelor' in text_lower:
        found_terms.add('Bachelor')
    if 'master' in text_lower:
        found_terms.add('Master')
    if found_terms:
        return '; '.join(sorted(list(found_terms)))
    else:
        return text_lower
  


def clean_form_of_assessment(text):
    text_lower = str(text).lower()
    found_terms = set() # Use a set to automatically handle uniqueness and avoid duplicates

    # --- User-specified regex for "X or Y exam" pattern ---
    user_regex = r'(?:written|oral)\s+or\s+(?:written|oral)\s+exam'
    if re.search(user_regex, text_lower):
        found_terms.add('Written exam/Oral exam')

    # --- General checks for specific phrases (these will still add if not already present) ---

    # Exams
    # These will add terms if not already present from the 'or' logic, or for cases not matching the regex
    elif 'written examination' in text_lower or 'written exam' in text_lower:
        found_terms.add('Written exam')
    elif 'oral examination' in text_lower or 'oral exam' in text_lower:
        found_terms.add('Oral exam')

    # Reports
    if 'project report' in text_lower:
        found_terms.add('Project report')
    if 'research report' in text_lower:
        found_terms.add('Research report')
    # Generic 'Report': add if 'report' is in the text, and no more specific report type has been captured yet
    if 'report' in text_lower and not any(r_type in found_terms for r_type in ['Project report', 'Research report']) and 'report' not in text_lower.replace('project report','').replace('research report',''):
        found_terms.add('Report')


    if 'presentation' in text_lower:
        found_terms.add('Presentation')

    # Other specific checks
    if 'learning portfolio' in text_lower:
        found_terms.add('Learning portfolio')
    if 'essay' in text_lower:
        found_terms.add('Essay')
    if 'online' in text_lower:
        found_terms.add('Online')
    if 'group assignment' in text_lower:
        found_terms.add('Group assignment')

    # Convert set to list and sort for consistent output, then join
    if found_terms:
        return '; '.join(sorted(list(found_terms)))
    else:
        # Fallback if no keywords are found, returning the original lowercased text
        return text_lower

def clean_admission_requirements(text):
    text_str = str(text).strip().lower()
    if text_str in ['', 'none', 'nan', 'n/a', '-']:
        return 'None'
    else:
        found_terms = set()
        if 'homework' in text_str:
            found_terms.add('Homework Assignments')
        if 'presentations' in text_str:
            found_terms.add('Presentations')
        if 'participation' in text_str:
            found_terms.add('Participation')
        if found_terms:
            return '; '.join(sorted(list(found_terms)))
        else:
        # Fallback if no keywords are found, returning the original lowercased text
            return text_str
        
def clean_duration_of_assessment(text):
    text_str = str(text).strip().lower()
    # New condition: if neither 'minute' nor 'week' is in the text, classify as 'Not applicable'
    if 'minute' not in text_str and 'week' not in text_str:
        return 'not applicable'
    else:
        return text_str
    
def clean_language(text):
    text_lower = str(text).lower()
    found_terms = set()

    if "german" or "deutsch" in text_lower:
        found_terms.add("German")
    if "english" or "englisch" in text_lower:
        found_terms.add("English")
    if found_terms:
        return '; '.join(sorted(list(found_terms)))
    else:
        return text_lower
    
def clean_offering(text):
    text_lower = str(text).lower()
    found_terms = set()
    if 'fall' in text_lower or 'hws' in text_lower or 'herbst' in text_lower:
        found_terms.add('hws')
    if 'spring' in text_lower or 'fss' in text_lower or 'frühjahr' in text_lower:
        found_terms.add('fss')
    if 'every' in text_lower or 'regelmäßig' in text_lower or 'jedes' in text_lower:
        found_terms.add('hws')
        found_terms.add('fss')
    if 'irregular' in text_lower or 'unregelmäßig' in text_lower:
        found_terms.add('irregular')

    if found_terms:
        return '; '.join(sorted(list(found_terms)))
    else:
        return text_lower
    
def clean_further(df):
    for idx, further in df['further_modules'].items():
        further_lower = str(further).lower()
        found_courses = set()

        for module in df['name']:
            if str(module).lower() in further_lower:
                found_courses.add(module)

        if found_courses:
            df.at[idx, 'further_modules'] = '; '.join(sorted(found_courses))
        else:
            df.at[idx, 'further_modules'] = further_lower

    return df

def standardize_range_of_application(text):
    standardized_applications = []
    #for app in applications_list:
    app_lower = str(text).lower().replace('\n', '').replace('-', '').replace(' ', '')
    #print(app_lower)
    if 'mmds' in app_lower or 'mannheimmasterindatascience' in app_lower:
        standardized_applications.append('M.Sc. Mannheim Master in Data Science')
    if 'mmsds' in app_lower or 'mannheimmasterinsocialdatascience' in app_lower:
        standardized_applications.append('M.Sc. Mannheim Master in Social Data Science')
    if 'm.sc.wirtschaftsinformatik' in app_lower or 'm.sc.businessinformatics' in app_lower:
        standardized_applications.append('M.Sc. Wirtschaftsinformatik')
    if 'b.sc.wirtschaftsinformatik' in app_lower:
        standardized_applications.append('B.Sc. Wirtschaftsinformatik')
    if 'lehramtinformatik' in app_lower:
        standardized_applications.append('Lehramt Informatik')
    if 'm.sc.mathematik' in app_lower:
        standardized_applications.append('M.Sc. Mathematik')
    if 'm.sc.wirtschaftsmathematik' in app_lower:
        standardized_applications.append('M.Sc. Wirtschaftsmathematik')
    if 'm.sc.wirtschaftspädagogik' in app_lower:
        standardized_applications.append('M.Sc. Wirtschaftspädagogik')
    if 'minorappliedcomputerscience' in app_lower:
        standardized_applications.append('Minor Applied Computer Science')

    return '; '.join(sorted(list(standardized_applications)))

def clean_semester(text):
    text_lower = str(text).lower()
    found_sems = set()
    if '1' in text_lower:
        found_sems.add('1')
    if '2' in text_lower:
        found_sems.add('2')
    if '3' in text_lower:
        found_sems.add('3')
    if '4' in text_lower:
        found_sems.add('4')
    if found_sems:
        return '; '.join(sorted(list(found_sems)))
    else:
        return text_lower