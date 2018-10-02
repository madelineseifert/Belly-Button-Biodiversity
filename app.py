# import necessary dependencies

# Flask (Server)
from flask import Flask, jsonify, render_template, request, flash, redirect

# SQL Alchemy (ORM)
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, desc,select

import pandas as pd
import numpy as np



# Database Setup

engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)

# save references to the tables in database
OTU = Base.classes.otu
Samples = Base.classes.samples
Samples_Metadata= Base.classes.samples_metadata


session = Session(engine)

app = Flask(__name__)


# Flask Routes
#################################################

#route("/")
# dashboard home
@app.route("/")
def index():
    return render_template("index.html")

#route('/names')
# returns a list of sample names
@app.route('/names')
def names():
    sample = session.query(Samples).statement
    df = pd.read_sql_query(sample, session.bind)
    df.set_index('otu_id', inplace=True)
        
    return jsonify(list(df.columns))

#route('/otu')
@app.route('/otu')
def otu():
    results = session.query(OTU.lowest_taxonomic_unit_found).all()

    # extract list of tuples to otu descriptions
    otu_list = list(np.ravel(results))
    return jsonify(otu_list)

#route('/metadata/<sample>')

@app.route('/metadata/<sample>')
def sample_metadata(sample):
    sel = [Samples_Metadata.SAMPLEID, Samples_Metadata.ETHNICITY,
           Samples_Metadata.GENDER, Samples_Metadata.AGE,
           Samples_Metadata.LOCATION, Samples_Metadata.BBTYPE]

    # strips "BB" prefix
    results = session.query(*sel).\
        filter(Samples_Metadata.SAMPLEID == sample[3:]).all()

    # dictionary for metadata information
    sample_metadata = {}
    for result in results:
        sample_metadata['SAMPLEID'] = result[0]
        sample_metadata['ETHNICITY'] = result[1]
        sample_metadata['GENDER'] = result[2]
        sample_metadata['AGE'] = result[3]
        sample_metadata['LOCATION'] = result[4]
        sample_metadata['BBTYPE'] = result[5]

    return jsonify(sample_metadata) 
  
    
#route('/wfreq/<sample>')

@app.route('/wfreq/<sample>')
def sample_wfreq(sample):

    # strips the "BB" prefix
    results = session.query(Samples_Metadata.WFREQ).\
        filter(Samples_Metadata.SAMPLEID == sample[3:]).all()
    wfreq = np.ravel(results)

    # returns 1st value for belly button washing
    return jsonify(int(wfreq[0]))


#route('/samples/<sample>')

@app.route('/samples/<sample>')
def samples(sample):
    stmt = session.query(Samples).statement
    df = pd.read_sql_query(stmt, session.bind)

    # make sure sample exists in data or throw error
    if sample not in df.columns:
        return jsonify(f"error, sample: {sample} not found"), 400

    # return sample values greater than 1
    df = df[df[sample] > 1]

    # sort in descending order
    df = df.sort_values(by=sample, ascending=0)

    data = [{
        "otu_ids": df[sample].index.values.tolist(),
        "sample_values": df[sample].values.tolist()
    }]
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port = 5005)



