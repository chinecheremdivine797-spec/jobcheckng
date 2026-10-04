package com.veriprep.global;

import android.app.Activity;
import android.os.Bundle;
import android.os.StrictMode;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String SUPABASE_URL = "https://qeqkndfwacfxgimevxjc.supabase.co";
    private static final String SUPABASE_KEY = "sb_publishable_Eja3hi7ewZl72DWcSYLX0Q_8ufAJiCz";
    private static final String PREFS = "veriprep_session";

    private LinearLayout root;
    private SharedPreferences prefs;
    private String accessToken;
    private TextView status;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StrictMode.setThreadPolicy(new StrictMode.ThreadPolicy.Builder().permitAll().build());
        prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        accessToken = prefs.getString("access_token", null);
        if (accessToken == null) showAuth(); else showDashboard();
    }

    private TextView text(String value, int size, int color) {
        TextView t = new TextView(this);
        t.setText(value); t.setTextSize(size); t.setTextColor(color);
        t.setPadding(0, 8, 0, 8);
        return t;
    }

    private EditText field(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint); e.setTextSize(16); e.setSingleLine(true);
        e.setPadding(20, 14, 20, 14);
        return e;
    }

    private Button button(String label) {
        Button b = new Button(this);
        b.setText(label); b.setTextSize(15); b.setAllCaps(false);
        b.setMinHeight(52);
        return b;
    }

    private void base(String title, String subtitle) {
        ScrollView scroll = new ScrollView(this);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(28, 30, 28, 30);
        root.setBackgroundColor(Color.rgb(248,250,253));
        scroll.addView(root);
        setContentView(scroll);
        root.addView(text("VERIPREP GLOBAL • v0.1.0", 14, Color.rgb(49,92,255)));
        TextView h = text(title, 30, Color.rgb(11,16,32));
        h.setGravity(Gravity.LEFT);
        root.addView(h);
        root.addView(text(subtitle, 15, Color.rgb(82,92,112)));
    }

    private void showAuth() {
        base("Prepare. Verify. Present with Confidence.", "Candidate readiness for employment background screening.");
        final EditText email = field("Email");
        final EditText password = field("Password");
        password.setInputType(0x81);
        root.addView(email); root.addView(password);
        Button signIn = button("Sign in");
        Button signUp = button("Create account");
        root.addView(signIn); root.addView(signUp);
        status = text("", 14, Color.rgb(180,40,40)); root.addView(status);

        signIn.setOnClickListener(v -> auth(false, email.getText().toString().trim(), password.getText().toString()));
        signUp.setOnClickListener(v -> auth(true, email.getText().toString().trim(), password.getText().toString()));
    }

    private void auth(boolean signup, String email, String password) {
        if (email.isEmpty() || password.length() < 6) { status.setText("Enter a valid email and a password of at least 6 characters."); return; }
        try {
            String path = signup ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
            JSONObject body = new JSONObject().put("email", email).put("password", password);
            JSONObject out = request("POST", SUPABASE_URL + path, body.toString(), null);
            String token = out.optString("access_token", "");
            if (token.isEmpty()) {
                status.setText(signup ? "Account created. Check your email if confirmation is required, then sign in." : out.optString("msg", "Sign-in failed."));
                return;
            }
            accessToken = token;
            prefs.edit().putString("access_token", token).apply();
            showDashboard();
        } catch (Exception e) { status.setText("Connection error: " + e.getMessage()); }
    }

    private void showDashboard() {
        base("Candidate readiness", "Your VeriPrep workspace is connected to the secure Supabase backend.");
        Button profile = button("1  Candidate profile");
        Button newCase = button("2  Start readiness case");
        Button upload = button("3  Documents & evidence");
        Button report = button("4  Readiness report");
        Button signOut = button("Sign out");
        root.addView(profile); root.addView(newCase); root.addView(upload); root.addView(report);
        status = text("Backend: connected", 14, Color.rgb(30,130,80)); root.addView(status);
        root.addView(signOut);

        profile.setOnClickListener(v -> showProfile());
        newCase.setOnClickListener(v -> createCase());
        upload.setOnClickListener(v -> Toast.makeText(this, "Document upload screen is next in the APK build.", Toast.LENGTH_LONG).show());
        report.setOnClickListener(v -> Toast.makeText(this, "Report screen will read the VeriPrep report tables.", Toast.LENGTH_LONG).show());
        signOut.setOnClickListener(v -> { prefs.edit().clear().apply(); accessToken=null; showAuth(); });
    }

    private void showProfile() {
        base("Candidate profile", "Keep your information accurate and consistent with your official records.");
        EditText full = field("Full legal name");
        EditText mail = field("Email");
        EditText phone = field("Phone");
        EditText dob = field("Date of birth (YYYY-MM-DD)");
        EditText country = field("Current country");
        EditText target = field("Target country");
        root.addView(full); root.addView(mail); root.addView(phone); root.addView(dob); root.addView(country); root.addView(target);
        Button save = button("Save candidate profile");
        Button back = button("Back");
        root.addView(save); root.addView(back);
        status = text("",14,Color.rgb(30,130,80)); root.addView(status);

        try {
            JSONArray arr = new JSONArray(requestRaw("POST", SUPABASE_URL + "/rest/v1/rpc/veriprep_get_candidate", "{}", accessToken));
            if (arr.length() > 0) {
                JSONObject c=arr.getJSONObject(0);
                full.setText(c.optString("full_name","")); mail.setText(c.optString("email",""));
                phone.setText(c.optString("phone","")); dob.setText(c.optString("date_of_birth",""));
                country.setText(c.optString("country","")); target.setText(c.optString("target_country",""));
            }
        } catch(Exception ignored) {}

        save.setOnClickListener(v -> {
            try {
                JSONObject b=new JSONObject();
                b.put("p_full_name",full.getText().toString().trim());
                b.put("p_email",mail.getText().toString().trim());
                b.put("p_phone",phone.getText().toString().trim());
                String d=dob.getText().toString().trim();
                b.put("p_date_of_birth",d.isEmpty()?JSONObject.NULL:d);
                b.put("p_country",country.getText().toString().trim());
                b.put("p_target_country",target.getText().toString().trim());
                requestRaw("POST",SUPABASE_URL+"/rest/v1/rpc/veriprep_upsert_candidate",b.toString(),accessToken);
                status.setText("Candidate profile saved securely.");
            } catch(Exception e){status.setText("Could not save profile: "+e.getMessage());}
        });
        back.setOnClickListener(v -> showDashboard());
    }

    private void createCase() {
        base("Start a readiness case", "Choose the service level and target country.");
        Spinner pack=new Spinner(this);
        String[] packs={"basic","global","concierge"};
        pack.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,packs));
        EditText country=field("Target country (e.g. UK, USA, Canada)");
        root.addView(pack); root.addView(country);
        Button create=button("Create case");
        Button back=button("Back");
        root.addView(create); root.addView(back);
        status=text("",14,Color.rgb(30,130,80)); root.addView(status);
        create.setOnClickListener(v -> {
            try {
                JSONObject b=new JSONObject().put("p_package",pack.getSelectedItem().toString()).put("p_country_target",country.getText().toString().trim());
                JSONObject out=new JSONObject(requestRaw("POST",SUPABASE_URL+"/rest/v1/rpc/veriprep_create_case",b.toString(),accessToken));
                status.setText("Case created: "+out.optString("case_id","")+". Continue with documents and audit readiness.");
            } catch(Exception e){status.setText("Could not create case: "+e.getMessage());}
        });
        back.setOnClickListener(v -> showDashboard());
    }

    private JSONObject request(String method,String url,String body,String token) throws Exception {
        return new JSONObject(requestRaw(method,url,body,token));
    }

    private String requestRaw(String method,String urlString,String body,String token) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(urlString).openConnection();
        c.setRequestMethod(method); c.setConnectTimeout(20000); c.setReadTimeout(20000);
        c.setRequestProperty("apikey",SUPABASE_KEY);
        c.setRequestProperty("Content-Type","application/json");
        c.setRequestProperty("Accept","application/json");
        if(token!=null)c.setRequestProperty("Authorization","Bearer "+token);
        if(body!=null){c.setDoOutput(true);try(OutputStream os=c.getOutputStream()){os.write(body.getBytes(StandardCharsets.UTF_8));}}
        int code=c.getResponseCode();
        InputStream is=code>=200&&code<400?c.getInputStream():c.getErrorStream();
        String out=read(is);
        if(code<200||code>=300) throw new IOException(out.isEmpty()?("HTTP "+code):out);
        return out;
    }

    private String read(InputStream is)throws Exception{
        if(is==null)return "";
        StringBuilder s=new StringBuilder();
        try(BufferedReader r=new BufferedReader(new InputStreamReader(is,StandardCharsets.UTF_8))){
            String line; while((line=r.readLine())!=null)s.append(line);
        }
        return s.toString();
    }
}
