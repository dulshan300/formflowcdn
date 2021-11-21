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
    var applications = db.collection("applications");
    var storage = firebase.storage();
    var storageRef = storage.ref();

    var app = new Vue({
        el: "#app",
        data: {
            current_step: 1, // do not remove
            total_step: 0, // do not remove
            // Add your code below here
            file_name: "",
            work_unite: "",
            work_unites: work_unites,
            file: null,
            name: "",
            phone_number: "",
            email: "",
            address: "",
            emp_type: "",
            application: null,
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {
            emp_type: function () {
                console.log(this.emp_type);
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
                if (files[0].size < 5200000) {
                    this.file = {};
                    this.file.file = files[0];
                    this.file.ext = files[0].type.split("/")[1];
                    this.file.name =
                        this.name +
                        Date.now() +
                        "." +
                        files[0].type.split("/")[1];

                    this.file_name = files[0].name;
                } else {
                    alert("Maximum size is 5mb");
                }
            },

            send_application: async function () {
                if (this.validate()) {
                    // save data to firebase
                    let id = "JA-" + Date.now();
                    let data = {
                        id: id,
                        name: this.name,
                        phone: this.phone_number,
                        email: this.email,
                        address: this.address,
                        employment_type: this.emp_type,
                        work_unite: this.work_unite,
                    };

                    await applications.doc(id).set(data);
                    this.application = data;

                    // upload cv file & get cv file download url

                    var userRef = storageRef.child(
                        "cv/" + id + "." + app.file.ext
                    );
                    await userRef.put(app.file.file).then(async (snapshot) => {
                        let full_path = snapshot.metadata.fullPath;
                        await storageRef
                            .child(full_path)
                            .getDownloadURL()
                            .then((url) => {
                                app.application.file_url = url;
                            });
                    });
                    // send mail
                    await this.mail();
                    // send thank mail

                    this.file_name = "";
                    this.work_unite = "";
                    this.work_unites = work_unites;
                    this.file = null;
                    this.name = "";
                    this.phone_number = "";
                    this.email = "";
                    this.address = "";
                    this.emp_type = "";
                    this.application = null;

                    return true;
                } else {
                    return 0;
                }
            },

            validate: function () {
                var valid = true;
                $("#et").removeClass("error_text");
                $("#lblcv").removeClass("error_text");
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

                    if (this.type == "file") {
                        if (!app.file) {
                            $("#lblcv").addClass("error_text");
                            valid = false;
                        }
                    }

                    if (app.emp_type == "") {
                        $("#et").addClass("error_text");
                    }
                });
                return valid;
            },
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    id: this.application.id,
                    name: this.application.name,
                    email: this.application.email,
                    phone_number: this.application.phone,
                    address: this.application.address,
                    employment_type: this.application.employment_type,
                    work_unite: this.application.work_unite,
                    file_url: this.application.file_url,
                };

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
                        // console.log(data);
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
            <div class="content"><slot></slot></div>
            <hr>
            <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-secondary mr-1" v-if="isBack" v-on:click="back">Back</button>
                <button :disabled="$data._dnext" type="button" class="btn btn-primary" v-on:click="next"> 
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                {{$data._bnext}}</button>
            </div>
        </div>      
      </div>`,
            data: function () {
                return {
                    isBack: this.step == 1 ? false : true,
                    _bnext: this.bnext ? this.bnext : "Next",
                    _dnext: this.dnext ? this.dnext : false,
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
