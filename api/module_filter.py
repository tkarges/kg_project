from http.server import BaseHTTPRequestHandler
import json
import os
from rdflib import Graph, Namespace, Literal, XSD, URIRef

graph = Graph()
TTL_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'module_graph.ttl')
graph.parse(TTL_PATH, format='turtle')

def parse_object_term(relation: str, obj: str):
    IN = Namespace('http://example.org/data/')
    base_url = 'http://example.org/data/'

    if relation == 'hasECTS':
        return Literal(int(obj), datatype=XSD.integer)
    
    if relation == 'taughtBy':
        obj = base_url + obj
        return URIRef(obj)
    
    if relation == 'hasLevel':
        return IN[obj]
    
    return Literal(obj)
        

def run_query(relation: str, obj: str):
    query = f'''
        PREFIX ex: <http://example.org/schema/>

        SELECT ?module_name
        WHERE {{
            ?m a ex:Module ;
                ex:hasModuleName ?module_name ;
                ex:{relation} ?obj .

            FILTER(?obj = ?query_input)
        }}
    '''

    result = graph.query(query, initBindings={'var': parse_object_term(relation, obj)})
    cleaned_results = []
    for row in result:
        name = str(row["module_name"]).replace("[WS]", " ")
        cleaned_results.append({'subject': name})
    return cleaned_results

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            payload = {}
        
        relation = payload.get('relation')
        obj = payload.get('object')
        result = run_query(relation, obj)

        response = json.dumps(result).encode()

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(response)