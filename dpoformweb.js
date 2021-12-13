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
            first_name: "",
            last_name: "",
            phone_number: "",
            email: "",
            id_number: "",
            dob: "",
            moi: "",
            address: "",
            city: "",
            region: "",
            district: "",
            districts: [],
            emp_type: "",
            device_type: "",
            device_payment: {},
            application: null,
            payment_ref: "",
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {
            emp_type: function () {
                console.log(this.emp_type);
            },
            region(val) {
                let data = [];
                for (const reg of regions) {
                    if (reg.region === val) {
                        data = reg.districts;
                        this.district = "";
                    }
                }

                this.districts = data;
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

            async makePayment() {
                if (this.validate()) {
                    let fdata = {
                        id: this.id_number,
                        first_name: this.first_name,
                        last_name: this.last_name,
                        phone_number: this.phone_number,
                        email: this.email,
                        dob: this.dob,
                        moi: this.moi,
                        address: this.address,
                        city: this.city,
                        region: this.region,
                        district: this.district,
                        emp_type: this.emp_type,
                        device_type: this.device_type,
                        device_payment_title: this.device_payment.title,
                        device_payment_value: this.device_payment.value,
                        payment_ref: "",
                    };

                    if (this.device_payment.value > 0) {
                        // make payment
                        let handler = PaystackPop.setup({
                            key: PUB_KEY, // Replace with your public key
                            email: this.email,
                            currency: "GHS",
                            // plan: app.selected_plan,
                            channels: ["card", "bank", "mobile_money"],
                            amount: this.device_payment.value * 100,
                            ref:
                                "DPO" +
                                Math.floor(Math.random() * 1000000000 + 1), // generates a pseudo-unique reference. Please replace with a reference you generated. Or remove the line entirely so our API will generate one for you
                            // label: "Optional string that replaces customer email"
                            onClose: function () {
                                return false;
                            },
                            callback: function (response) {
                                app.payment_ref = response.reference;
                                app.current_step = 2;
                                fdata.payment_ref = response.reference;

                                (async function () {
                                    // save data
                                    await applications.doc(fdata.id).set(fdata);
                                    app.application = fdata;
                                    // send mails
                                    app.mail();
                                })();
                            },
                        });
                        handler.openIframe();
                    } else {
                        // save data
                        await applications.doc(fdata.id).set(fdata);
                        this.application = fdata;
                        // send mails
                        this.mail();
                        this.current_step = 2;
                    }
                }
            },

            goToHome: () => {
                window.location.replace(BASE_URL);
            },

            validate: function () {
                var valid = true;
                $("#et").removeClass("error_text");
                $("#et2").removeClass("error_text");
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

                    if (app.device_type == "") {
                        $("#et2").addClass("error_text");
                    }
                });
                return valid;
            },
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    first_name: this.application.first_name,
                    last_name: this.application.last_name,
                    dob: this.application.dob,
                    email: this.application.email,
                    phone_number: this.application.phone_number,
                    address: this.application.address,
                    city: this.application.city,
                    region: this.application.region,
                    district: this.application.district,
                    moi: this.application.moi,
                    id: this.application.id,
                    employment_type: this.application.emp_type,
                    device_type: this.application.device_type,
                    device_payment_title: this.application.device_payment_title,
                    device_payment_value: this.application.device_payment_value,
                    payment_ref: this.application.payment_ref,
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
                <button :disabled="$data._dnext" type="button" class="btn btn-primary" v-on:click="next"> 
                <span v-if="processing" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
