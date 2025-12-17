const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200',
});

async function run() {
    try {
        console.log('Testing connection to Elasticsearch...');
        const health = await client.cluster.health();
        console.log('Cluster health:', health);

        console.log('Checking index "toptop_v3"...');
        const indexExists = await client.indices.exists({ index: 'toptop_v3' });
        console.log('Index "toptop_v3" exists:', indexExists);

        if (!indexExists) {
            console.log('Index does not exist. Creating it...');
            await client.indices.create({ index: 'toptop_v3' });
            console.log('Index created.');
        }

        console.log('Testing search...');
        const result = await client.search({
            index: 'toptop_v3',
            query: { match_all: {} }
        });
        console.log('Search success. Hits:', result.hits.total);

    } catch (error) {
        console.error('Elasticsearch Error Message:', error.message);
        if (error.meta) {
            console.error('Error Meta:', JSON.stringify(error.meta, null, 2));
        } else {
            console.error('Full Error:', error);
        }
    }
}

run();
