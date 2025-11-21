import pandas as pd
from rdflib import Graph, URIRef, Literal, BNode, Namespace
from rdflib.namespace import OWL, RDF, RDFS, XSD, FOAF
from rdflib.collection import Collection
import numpy as np

class KnowledgeGraph:
    def __init__(self, data: pd.DataFrame):
        """
        Initialize the KnowledgeGraph with a pandas DataFrame.

        Parameters:
        data (pd.DataFrame): A DataFrame containing the knowledge graph data.
        """
        self.data = data
        self.EX = Namespace("http://example.org/schema/")
        self.IN = Namespace("http://example.org/data/") # IN for instances
        self.graph = Graph()
        self._define_schema()
        self._extract_data()
        
    def _define_schema(self):
        EX = self.EX
        IN = self.IN
        self.graph.bind("ex", EX)
        self.graph.bind("in", IN)
        self.graph.bind("foaf", FOAF)
        self.graph.bind("owl", OWL)
        self.graph.bind("rdf", RDF)
        self.graph.bind("rdfs", RDFS)
        self.graph.bind("xsd", XSD)

        study_program = EX.StudyProgram
        module = EX.Module
        level = EX.Level
        lecturer = EX.Lecturer
        offering_semester = EX.OfferingSemester


        # Define Classes
        classes = [study_program, module, level, lecturer]
        for cls in classes:
            self.graph.add((cls, RDF.type, OWL.Class))
        
        self.graph.add((lecturer, RDFS.subClassOf, FOAF.Person))

        master = IN.Master
        bachelor = IN.Bachelor

        level_list_bnode = BNode()
        Collection(self.graph, level_list_bnode, [master, bachelor])
        self.graph.add((level, OWL.oneOf, level_list_bnode))

        hws = IN.HWS
        fss = IN.FSS

        offering_semester_list_bnode = BNode()
        Collection(self.graph, offering_semester_list_bnode, [hws, fss])
        self.graph.add((offering_semester, OWL.oneOf, offering_semester_list_bnode))
        
        has_module_id = EX.hasModuleID
        has_module_name = EX.hasModuleName
        has_type = EX.hasType
        has_level = EX.hasLevel
        has_ects = EX.hasECTS
        has_prerequisite = EX.hasPrerequisite
        has_aim = EX.hasAim
        has_literature = EX.hasLiterature
        has_assessment_form = EX.hasAssessmentForm
        has_admission_requirements = EX.hasAdmissionRequirements
        has_assessment_duration = EX.hasAssessmentDuration
        has_language = EX.hasLanguage
        offered_in = EX.offeredIn
        taught_by = EX.taughtBy
        has_person_in_charge = EX.hasPersonInCharge
        has_further_module = EX.hasFurtherModule
        has_application_range = EX.hasApplicationRange
        recommended_semester = EX.recommendedSemester


        # Define Object Properties
        object_properties = [
            has_level, has_prerequisite, offered_in, taught_by, has_person_in_charge,
            has_further_module, has_application_range
        ]

        for prop in object_properties:
            self.graph.add((prop, RDF.type, OWL.ObjectProperty))

        self.graph.add((has_prerequisite, RDF.type, OWL.IrreflexiveProperty))
        self.graph.add((has_further_module, RDF.type, OWL.IrreflexiveProperty))
        self.graph.add((has_prerequisite, RDF.type, OWL.AsymmetricProperty))
        self.graph.add((has_further_module, RDF.type, OWL.AsymmetricProperty))

        self.graph.add((has_level, RDFS.domain, module))
        self.graph.add((has_level, RDFS.range, level))

        self.graph.add((has_prerequisite, RDFS.domain, module))
        self.graph.add((has_prerequisite, RDFS.range, module))

        self.graph.add((offered_in, RDFS.domain, module))
        self.graph.add((offered_in, RDFS.range, offering_semester))

        self.graph.add((taught_by, RDFS.domain, module))
        self.graph.add((taught_by, RDFS.range, lecturer))

        self.graph.add((has_person_in_charge, RDFS.domain, module))
        self.graph.add((has_person_in_charge, RDFS.range, FOAF.Person))

        self.graph.add((has_further_module, RDFS.domain, module))
        self.graph.add((has_further_module, RDFS.range, module))

        self.graph.add((has_application_range, RDFS.domain, module))
        self.graph.add((has_application_range, RDFS.range, study_program))

        # Define Datatype Properties
        datatype_properties = [
            has_module_id, has_module_name, has_type, has_ects, has_aim, has_literature, has_assessment_form,
            has_admission_requirements, has_assessment_duration, has_language, recommended_semester
        ]

        for prop in datatype_properties:
            self.graph.add((prop, RDF.type, OWL.DatatypeProperty))

        self.graph.add((has_module_id, RDFS.domain, module))
        self.graph.add((has_module_id, RDFS.range, XSD.string))

        self.graph.add((has_module_name, RDFS.domain, module))
        self.graph.add((has_module_name, RDFS.range, XSD.string))

        self.graph.add((has_type, RDFS.domain, module))
        self.graph.add((has_type, RDFS.range, XSD.string))

        self.graph.add((has_ects, RDFS.domain, module))
        self.graph.add((has_ects, RDFS.range, XSD.integer))

        self.graph.add((has_aim, RDFS.domain, module))
        self.graph.add((has_aim, RDFS.range, XSD.string))

        self.graph.add((has_literature, RDFS.domain, module))
        self.graph.add((has_literature, RDFS.range, XSD.string))

        self.graph.add((has_assessment_form, RDFS.domain, module))
        self.graph.add((has_assessment_form, RDFS.range, XSD.string))

        self.graph.add((has_admission_requirements, RDFS.domain, module))
        self.graph.add((has_admission_requirements, RDFS.range, XSD.string))

        self.graph.add((has_assessment_duration, RDFS.domain, module))
        self.graph.add((has_assessment_duration, RDFS.range, XSD.integer))

        self.graph.add((has_language, RDFS.domain, module))
        self.graph.add((has_language, RDFS.range, XSD.string))

        self.graph.add((recommended_semester, RDFS.domain, module))
        self.graph.add((recommended_semester, RDFS.range, XSD.integer))

    def _extract_data(self):
        """
        Extract data from the pandas DataFrame and populate the RDF graph.
        """
        EX = self.EX
        IN = self.IN

        classes_dict = {
            "level": EX.Level,
            "lecturer": EX.Lecturer,
            "offering": EX.OfferingSemester,
            "prerequisites": EX.Module,
            "further_module": EX.Module,
            "application_range": EX.StudyProgram,
            "person_in_charge": FOAF.Person
        }

        def handle_none_values(sub, rel, obj):
            if pd.notna(sub) and pd.notna(obj):
                self.graph.add((IN[sub], rel, IN[obj]))

        def handle_none_literals(sub, rel, obj, datatype):
            if pd.notna(sub) and pd.notna(obj):
                self.graph.add((IN[sub], rel, Literal(obj, datatype=datatype)))

        def handle_multiple_values(sub, rel, obj, type):
            if pd.notna(sub) and pd.notna(obj):
                for item in str(obj).split(';'):
                    self.graph.add((IN[item.strip()], RDF.type, classes_dict[type]))
                    self.graph.add((IN[sub], rel, IN[item.strip()]))
        
        def handle_multiple_literals(sub, rel, obj, datatype):
            if pd.notna(sub) and pd.notna(obj):
                for item in str(obj).split(';'):
                    self.graph.add((IN[sub], rel, Literal(item.strip(), datatype=datatype)))

        for _, row in self.data.iterrows():
            self.graph.add((IN[row['module_id']], RDF.type, EX.Module))

            # datatype properties
            handle_none_literals(row['module_id'], EX.hasModuleID, row['module_id'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasModuleName, row['module_name'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasType, row['type'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasECTS, row['ects'], datatype=XSD.integer)
            handle_none_literals(row['module_id'], EX.hasAim, row['aim'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasLiterature, row['literature'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasAssessmentForm, row['assessment_form'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasAdmissionRequirements, row['admission_requirements'], datatype=XSD.string)
            handle_none_literals(row['module_id'], EX.hasAssessmentDuration, row['assessment_duration'], datatype=XSD.integer)
            handle_none_literals(row['module_id'], EX.hasLanguage, row['language'], datatype=XSD.string)
            handle_multiple_literals(row['module_id'], EX.recommendedSemester, row['recommended_semester'], datatype=XSD.integer)

            # object properties
            handle_none_values(row['module_id'], EX.hasLevel, row['level'])
            handle_none_values(row['module_id'], EX.offeredIn, row['offering'])
            handle_multiple_values(row['module_id'], EX.hasPrerequisite, row['prerequisites'], 'prerequisites')
            handle_multiple_values(row['module_id'], EX.hasFurtherModule, row['further_module'], 'further_module')
            handle_multiple_values(row['module_id'], EX.hasApplicationRange, row['application_range'], 'application_range')
            handle_multiple_values(row['module_id'], EX.taughtBy, row['lecturer'], 'lecturer')
            handle_multiple_values(row['module_id'], EX.hasPersonInCharge, row['person_in_charge'], 'person_in_charge')

if __name__ == "__main__":
    data = {
        'module_id': ['CS101', 'CS102', 'DS500'],
        'module_name': ['Introduction to Programming', 'Data Structures and Algorithms', 'Machine Learning'],
        'type': ['Lecture with Exercise', 'Lecture with Exercise', 'Seminar'],
        'ects': [6, 6, 6],
        'aim': ['Learn basic programming concepts.', 'Learn fundamental data structures.', 'Understand ML models.'],
        'literature': ['"Think Python"', '"CLRS"', '"Bishop"'],
        'assessment_form': ['Written Exam', 'Written Exam', 'Project;Presentation'],
        'admission_requirements': [np.nan, 'Basic programming knowledge', 'Strong programming skills'],
        'assessment_duration': [90, 90, np.nan],  # Use np.nan for missing integer
        'language': ['English', 'English', 'English'],
        'recommended_semester': ['1', '2', '5;7'],
        'level': ['Bachelor', 'Bachelor', 'Master'],
        'offering': ['HWS', 'FSS', 'HWS'],
        'prerequisites': [np.nan, 'CS101', 'CS101;CS102'],
        'further_module': ['CS102', 'DS500', np.nan],
        'application_range': ['BSc_Business_Informatics;BSc_Business_Mathematics', 'BSc_Business_Informatics', 'MSc_Data_Science;MSc_Business_Informatics'],
        'lecturer': ['Prof_Smith', 'Prof_Doe', 'Prof_AI;Dr_New'],
        'person_in_charge': ['Prof_Smith', 'Prof_Doe', 'Prof_AI']
    }
    kg_instance = KnowledgeGraph(pd.DataFrame(data))
    
    my_graph = kg_instance.graph

    print(my_graph.serialize(format="turtle"))