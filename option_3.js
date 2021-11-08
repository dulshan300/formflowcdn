(function () {
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
    var storage = firebase.storage();
    var storageRef = storage.ref();
    var persons = db.collection("persons");
    var app = new Vue({
        el: "#app",
        data: {
            msg: "Hello Vue Wizard",
            current_step: 1, // do not remove
            total_step: 0, // do not remove
            // Add your code below here
            cosmo_products: _cosmo_products,
            selected_product: null,
            selected_plan: null,
            selected_product_name: null,
            is_valid: true,
            member: { id: null, plan: null, product: null },
            clame_amount: 0,
            clame_details: "",
            clame_error: false,
            docs: [],
            urls: [],
            form_data: {
                beneficiary: null,
                beneficiary_sponsor: {},
                pay_amount: 0,
                email: null,
                payment_ref: null,
                gender: "male",
                membership_no: null,
                surname: null,
                other_name: null,
            },
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {
            selected_product: function (d) {
                if (d) {
                    var pd = d.split("-");
                    this.form_data.pay_amount = parseFloat(pd[2]);
                    console.log(this.selected_product);
                    for (const product of this.cosmo_products) {
                        if (product.tag == pd[0]) {
                            this.selected_product_name =
                                product.name +
                                " - " +
                                (pd[1] == "MP"
                                    ? "Monthly Plan"
                                    : "Annual Plan");
                        }
                    }
                    this.selected_plan = pd[3];
                }
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
                this.form_data = {
                    beneficiary: null,
                    beneficiary_sponsor: {},
                    pay_amount: 0,
                    email: null,
                    payment_ref: null,
                    gender: "male",
                    membership_no: null,
                    surname: null,
                    other_name: null,
                };
            },
            // Add your code below here
            say: function () {
                console.log("say awasome");
                return true;
            },
            file_upload: function (e) {
                files = e.target.files;
                for (const file of files) {
                    if (file.size < 5500000) {
                        obj = {
                            name: file.name.split(".")[0],
                            file: file,
                            valid: true,
                        };

                        this.docs.push(obj);
                    } else {
                        obj = {
                            name: file.name.split(".")[0] + " (5mb Max)",
                            file: file,
                            valid: false,
                        };

                        this.docs.push(obj);
                    }
                }
            },

            remove_file: function (i) {
                this.docs.splice(i, 1);
            },

            validate_bdetails_1: function () {
                var valid = true;
                if (this.form_data.beneficiary == "Family_or_Friends") {
                    $("#bdetails2 input[required]").each(function () {
                        $(this).removeClass("error");
                        if ($(this).val() == "" || $(this).val() == null) {
                            $(this).addClass("error");
                            valid = false;
                        }
                        console.log(this.type);
                        if (this.type == "email") {
                            var re =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            if (!re.test($(this).val())) {
                                $(this).addClass("error");
                                valid = false;
                            }
                        }
                    });
                }

                return valid;
            },

            validate_bdetails: function () {
                var valid = true;
                $("#bdetails input[required],#bdetails select[required]").each(
                    function () {
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
                    }
                );
                return valid;
            },
            plan_type: function () {
                if (this.selected_product) {
                    var plan = this.selected_product.split("-");
                    for (const pro of this.cosmo_products) {
                        if (pro.tag === plan[0]) {
                            return pro.name;
                        }
                    }
                }
                return "";
            },
            plan_tenor: function () {
                if (this.selected_product) {
                    var plan = this.selected_product.split("-");
                    return plan[1] == "MP" ? "Monthly" : "Annually";
                }
                return "";
            },
            verify: async function () {
                // check user
                this.is_valid = true;
                if (this.form_data.membership_no != null) {
                    var doc = await persons
                        .where("pin", "==", this.form_data.membership_no)
                        .limit(1)
                        .get();
                    if (!doc.empty) {
                        this.member = doc.docs[0].data();
                        this.is_valid = true;

                        console.log(this.member);

                        return true;
                    } else {
                        this.is_valid = false;
                        return false;
                    }
                } else {
                    this.is_valid = false;
                }
            },
            clame: async function () {
                this.clame_error = false;

                if (this.member.status != "ACTIVE") {
                    this.clame_error = true;
                    return false;
                }

                if (this.docs) {
                    this.urls = [];
                    for (const fileData of this.docs) {
                        if (fileData.valid) {
                            var userRef = storageRef.child(
                                "support/" +
                                    +new Date() +
                                    "_" +
                                    fileData.file.name
                            );

                            await userRef
                                .put(fileData.file)
                                .then(async (snapshot) => {
                                    var path = snapshot.metadata.fullPath;
                                    await storageRef
                                        .child(path)
                                        .getDownloadURL()
                                        .then((url) => {
                                            app.urls.push({
                                                name: path,
                                                url: url,
                                            });

                                            console.log(url);
                                        });
                                });
                        }
                    }
                } else {
                    this.urls = null;
                }

                app.mail();
                return true;
            },
            mail: async function () {
                var temp = $("#email_body").html();
                var template = Handlebars.compile(temp);
                var email_body_data = {
                    plan_name: this.member.product + "-" + this.member.plan,
                    mb_number: this.member.id,
                    b_type: this.form_data.beneficiary,
                    s_name: this.form_data.beneficiary_sponsor.name,
                    s_phone: this.form_data.beneficiary_sponsor.phone,
                    s_email: this.form_data.beneficiary_sponsor.email,
                    su_name: this.member.surename,
                    o_name: this.member.other_name,
                    dob: this.member.dob,
                    gender: this.member.gender,
                    p_number: this.member.phone,
                    email: this.member.email,
                    id_type: this.member.id_type,
                    id_number: this.member.id_number,
                    clame_details: this.clame_details,
                    clame_amount: this.clame_amount,
                    urls: this.urls,
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
