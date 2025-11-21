from http.server import BaseHTTPRequestHandler
import json
import os
from rdflib import Graph, Namespace, Literal

graph = Graph()
TTL_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'module_graph.ttl')
graph.parse(TTL_PATH, format='turtle')

def run_example_query(program: str):
    query = '''
        PREFIX ex: <http://example.org/schema/>

        SELECT ?module_name
        WHERE {
            ?m a ex:Module ;
                ex:hasModuleName ?module_name ;
                ex:hasApplicationRange ?app_range .

            FILTER(strafter(str(?app_range), "/data/") = ?var)
        }
    '''
    result = graph.query(query, initBindings={'var': Literal(program)})
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
        
        example_program = payload.get('subject')
        result = run_example_query(example_program)

        response = json.dumps(result).encode()

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(response)