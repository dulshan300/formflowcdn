(function () {
    // firebase setup
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase
        .auth()
        .signInWithEmailAndPassword(_femail, _fpass)
        .then((userCredential) => {
            var user = userCredential.user;
            window.user = user;
            console.log(user);
        })
        .catch((error) => {
            console.log(error);
        });
    var db = firebase.firestore();
    var persons = db.collection("persons");
    var storage = firebase.storage();
    var storageRef = storage.ref();
    var settings = db.collection("settings");



    var app = new Vue({
        el: "#app",
        data: {
            msg: "Hello Vue Wizard",
            current_step: 1, // do not remove
            total_step: 0, // do not remove
            // Add your code below here
            form_data: { delivery: delivery_options[0] },
            delivery_options: delivery_options,
            photo: null,
            photo_url:"",
            phone_number: "",
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {
            'form_data.phone_number':function(value) {
                value = value.replaceAll(/\+0/gi,'');
                this.form_data.phone_number =  "+"+value.replaceAll(/\D/gi,'');
            },
        },
        methods: {
            // step_finish will execute as the last step next function
            // do not remove
            step_finish: function () {
                console.log("Last step");
                this.current_step = 1;
                app.data_reset();
            },

            data_reset: function () {
                this.form_data = {};
            },
            // Add your code below here
            say: function () {
                console.log("say awasome");
                return true;
            },

            file_upload: function (e) {
                files = e.target.files;
                console.log(files[0]);
                if (files[0].size < 2000000) {
                    this.photo = {};
                    this.photo.file = files[0];
                    this.photo.ext = files[0].type.split("/")[1];
                    this.photo.name =
                        this.form_data.mb_number +
                        "." +
                        files[0].type.split("/")[1];

                    console.log(this.photo.name);
                } else {
                    alert("Maximum size is 2mb");
                }
            },

            make_payment: async function (code = null) {

                var userRef = storageRef.child("support/" + app.photo.name);
                await userRef.put(app.photo.file).then(async (snapshot) => {
                    let full_path = snapshot.metadata.fullPath;
                    await storageRef
                    .child(full_path)
                    .getDownloadURL()
                    .then((url) => {           

                        app.photo_url = url;
                    });
                });

                let handler = PaystackPop.setup({
                    key: PUB_KEY, // Replace with your public key
                    email: app.form_data.email,
                    currency: "GHS",
                    // plan: app.selected_plan,
                    amount: app.form_data.delivery.value * 100,
                    ref: "CSMO" + Math.floor(Math.random() * 1000000000 + 1), // generates a pseudo-unique reference. Please replace with a reference you generated. Or remove the line entirely so our API will generate one for you
                    // label: "Optional string that replaces customer email"
                    onClose: function () {
                        return false;
                    },
                    callback: function (response) {
                        let message =
                            "Payment complete! Reference: " +
                            response.reference;
                        app.form_data.payment_ref = response.reference;
                        app.current_step = 2;
                        // send mails
                        app.mail();
                        return true;
                    },
                });
                handler.openIframe();
            },

            validate: function () {
                var valid = true;
                $(
                    "#msg input[required],#msg select[required], #msg textarea[required]"
                ).each(function () {
                    $(this).removeClass("error");
                    if ($(this).val() == "" || $(this).val() == null) {
                        $(this).addClass("error");
                        valid = false;
                    }
                    if (this.type == "email") {
                        var re =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (!re.test($(this).val())) {
                            $(this).addClass("error");
                            valid = false;
                        }
                    }
                });
                return valid;
            },
            msg_submit: async function () {
                if (app.validate()) {
                    app.mail();
                    return true;
                } else {
                    return false;
                }
            },
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    name: this.form_data.name,
                    mb_number: this.form_data.membership_no,
                    phone_number: this.form_data.phone_number,
                    email: this.form_data.email,
                    message: this.form_data.message,
                    delivery: this.form_data.delivery.name,
                    address: this.form_data.address,
                    photo_url: this.photo_url,
                };
                // console.log(template(email_body_data));
                var form = new FormData();

                form.append("_api_key", EMAIL_API.public_key);
                form.append("_from", EMAIL_API.from[0]);
                form.append("_from_name", EMAIL_API.from[1]);
                form.append("_subject", EMAIL_API.subject);
                form.append("_sg_key", EMAIL_API.sendgrid_key);

                for (const to of EMAIL_API.to) {
                    form.append("_to[]", to);
                }
                form.append("_body", template(email_body_data));
                $.ajax({
                    url: EMAIL_API.api_url,
                    method: "POST",
                    data: form,
                    processData: false,
                    contentType: false,
                    crossDomain: true,
                    // dataType: "json",
                    success: function (data) {
                        console.log(data);
                    },
                });
            },
        },
    });
    // Panel Component
    function panel() {
        // Panel Component
        var panel = {
            props: ["step", "title", "action", "bnext", "dnext"],
            template: `<div :data-step="step" v-if="$parent.current_step==step" class="vue-panel card">     
        <div class="card-body">
            <div v-if="title">
                <h5 class="text-center">{{title}}</h5>
                <hr>
            </div>
            <div><slot></slot></div>
            <hr>
            <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-secondary mr-1" v-if="isBack" v-on:click="back">Back</button>
                <button :disabled="dnext" type="button" class="btn btn-primary" v-on:click="next"> 
                <span v-if="processing" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                {{next_text}}</button>
            </div>
        </div>      
      </div>`,
            data: function () {
                return {
                    isBack: this.step == 1 ? false : true,
                    next_text: this.bnext ? this.bnext : "Next",
                    dnext: this.dnext ? this.dnext : false,
                    processing: false,
                };
            },
            methods: {
                next: async function () {
                    this.processing = true;
                    if (this.action) {
                        if (await this.$parent[this.action]()) {
                            if (
                                this.$parent.current_step ==
                                this.$parent.total_step
                            ) {
                                this.$parent.step_finish();
                            } else {
                                this.$parent.current_step++;
                            }
                        }
                    } else {
                        if (
                            this.$parent.current_step == this.$parent.total_step
                        ) {
                            this.$parent.step_finish();
                        } else {
                            this.$parent.current_step++;
                        }
                    }
                    this.processing = false;
                    console.log(this.$parent.total_step);
                },
                back: function () {
                    this.$parent.current_step--;
                },
            },
            created: function () {
                this.$parent.total_step += 1;
                console.log("Panel Created");
            },
        };
        return panel;
    }
    // End Panel Component
})();
