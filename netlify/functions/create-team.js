// Serverless function to create a team and add the creator as owner
// This bypasses RLS by using a service role key
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    // Parse request body
    const { name, description, userId } = JSON.parse(event.body);

    if (!name || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and userId are required' })
      };
    }

    // 1. Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : null,
        created_by: userId
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to create team',
          details: teamError.message 
        })
      };
    }

    // 2. Add the creator as team owner (bypasses RLS with service role key)
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner'
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding team owner:', memberError);
      
      // Attempt to clean up team
      await supabase.from('teams').delete().eq('id', team.id);
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to add you as team owner',
          details: memberError.message 
        })
      };
    }

    // Return success with team and member data
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        team,
        member
      })
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Server error',
        details: error.message 
      })
    };
  }
};
