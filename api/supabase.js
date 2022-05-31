const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('@supabase/supabase-js');
const {SUPABASE_API_URL, SUPABASE_API_KEY} = process.env;

const SupabaseClient = supabase.createClient(SUPABASE_API_URL, SUPABASE_API_KEY);

module.exports.FriggTweets = {
    Create: async (newRows) => {
        let { data, error } = await SupabaseClient.from('frigg-tweets').insert(newRows);
        if (error) console.log("Supabase: " + error);
        return data;
    },
    Read: async () => {
        let { data, error } = await SupabaseClient.from('frigg-tweets').select('*');
        if (error) console.log("Supabase: " + error);
        return data;
    },
}
module.exports.FriggQueries = {
    Create: async (newRows) => {
        let { data, error } = await SupabaseClient.from('frigg-tweets').insert(newRows);
        if (error) console.log("Supabase: " + error);
        return data;
    },
    Read: async () => {
        let { data, error } = await SupabaseClient.from('frigg-queries').select('*');
        if (error) console.log("Supabase: " + error);
        return data;
    },
}




